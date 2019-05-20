  - [Export](#use_case)
    - [From Bare Metal](#metal)
    - [From A Container Running In OpenShift](#export)
      - [Changing Init Configuration](#changing)
      - [Restart Container](#redeploy)
      - [Exporting Realms/Users To A File](#export_file)
        - [Automatic](#automatic)
	- [Manually](#manually)
      - [Streaming The Export File](#streaming)
      - [Restoring Init Configuration](#restoring-deployment)
  - [Import](#update)
    - [Deploy](#deploy)
    - [Mounting File Into RHSSO Container](#mounting)
    - [Running Container](#running)

# Export

<a name="metal"/>

## From Bare Metal

Exporting information in Keycloak is *trivial*, as the [documentation](https://www.keycloak.org/docs/2.5/server_admin/topics/export-import.html) state, we just need to locate the ``standalone.sh`` script and apply one of these options:

- To export everything (Realms, users, etc) as a single file:

```sh
bin/standalone.sh -Dkeycloak.migration.action=export
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=<path-to-folder>
```

- To export everything (Realms, users, etc) in a folder generating multiple files:

```sh
bin/standalone.sh -Dkeycloak.migration.action=export
-Dkeycloak.migration.provider=dir -Dkeycloak.migration.dir=<DIR TO EXPORT TO>
```

<a name="export"/>

## From A Container Running In OpenShift

Exporting data from RHSSO can be as simple as to copy the configuration file DB connections of one container, turning down all pods connecting to that particular DB and following the steps described above from an external RHSSO instance. But we can also use predictability offered by the container to ease this process.

In this guide we are going to modify the booting process of the container, then we are going to login, perform the export and restore the continer starting routine. 

##### Pre-Requisites

- [OpenShift Command-Line Client](https://github.com/openshift/origin/releases).
- [Logged into](https://docs.openshift.com/enterprise/3.2/cli_reference/get_started_cli.html) OpenShift Cluster up and running i.e., ``oc login``


### Getting Started

* We can start by scaling down the pods to one to avoid race condition on the DB while exporting:

```sh
  oc scale dc/sso --replicas=1
```

<a name="changing"/>

### Changing Init Configuration

Replace the container initial process by editing the deployment configuration:

```sh
 oc edit dc/sso  
```

> sso is the name of DeploymentConfig in this example.

Jump into the section: 

``spec -> template -> spec -> containers -> first-container`` 

And append this:

```xml
 - command:["/bin/sh" , "-c", "sleep 3600"]
```

Just below the ``image`` field:

```xml
spec:
  template:
    spec:
      containers:
        image: docker-registry.default.svc:5000/openshift/redhat-sso72-openshift
      - command:["/bin/sh" , "-c", "sleep 3600"]
```

> Now instead of running the internal scripts it will pause for 3K seconds, giving us time to perform our export. Feel free to change this time.

<a name="changing"/>

### Restart Container

Then we trigger a new deployment:

```sh
 oc rollout latest dc/sso
```

> This will recreate the containers

Now we should verify the new container:

```sh
oc get pods

#NAME            READY     STATUS    RESTARTS   AGE
#sso-8-bbb        0/1     Running      0       10sec
```

And check that we successfully override the container process:

```sh
 oc exec sso-33-svpx5 -- ps aux
#USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
jboss        1  0.0  0.0  12464  2412 ?        Ss   08:58   0:00   /bin/sh sleep 3600
```

> This container is using the **sleep** process as the root process (PID 1),  meaning that we have been successful.


##### Quick Review


![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/initial-export.gif?raw=true)

------

<a name="export_file"/>

### Exporting Realms/Users To A File

We have to login via [oc-rsh](https://docs.openshift.com/enterprise/3.1/dev_guide/ssh_environment.html) into our container:

```sh
oc rsh sso-8-bbb
# sh-4.2$
```

> Once inside we can start the export process.

<a name="automatic" />

#### Automatic 

If your container has access to the internet, you start the export process automatically by running this script:

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/import-export/scripts/export.sh)"
```

> This will start the export and save the generated file into ``/tmp/migrate.json``. If this file is to big you may need to mount a [PVC](https://docs.openshift.com/enterprise/3.1/dev_guide/persistent_volumes.html) in this folder.


<a name="manually" />

#### Manually 

Otherwise you have to do it manually:

```sh
## build configuration file standalone-openShift.xml using container parameters.
source /opt/eap/bin/launch/openshift-common.sh
source /opt/eap/bin/launch/logging.sh
source /opt/eap/bin/launch/configure.sh

## Start RHSSO import mode
sh /opt/eap/bin/standalone.sh -c standalone-openshift.xml -bmanagement 127.0.0.1 -Dkeycloak.migration.action=export \
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/migrate.json | grep -i export
```

> Here we start the RHSSO in export mode.

<a name="streaming"/>

### Streaming The Export File

This will start the RHSSO process in *export* mode, then we can open up a new terminal outside the container and use a script [fetch_from_pod.sh](https://github.com/cesarvr/keycloak-examples/blob/master/import-export/scripts/fetch_from_pod.sh) to stream the export file:

```sh
#sh scripts/fetch_from_pod <pod-name>
sh scripts/fetch_from_pod sso-8-bbb
```

This will do an [RSYNC](https://docs.openshift.com/container-platform/3.9/dev_guide/copy_files_to_container.html) against the container.

To do it manually:

```sh

#oc rsync pod-name:/folder-inside-pod local-folder
#for more info oc rsync -h
oc rsync sso-8-bbb:/tmp/migrate.json $HOME/your-folder
```

We should have a file called ``migrate.json`` inside the ``export`` folder if you used the script.


------
#### Example

* Exporting this users

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/users.png?raw=true)


![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/full-export.gif?raw=true)

> We start RHSSO in export mode, then we proceed to extract and stream the file with the RHSSO data out of the container.
------

<a name="streaming"/>

### Restoring Deployment

Last thing left is to restore the deployment configuration to the original state, we run:

```sh
oc edit dc/sso
```

Go to the section ``spec -> template -> spec -> containers -> first-container`` and remove the command parameter:

```xml
containers:
  - image: rhsso@...
```

Then trigger a new deployment:

```sh
oc rollout latest dc/sso
```

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/final-export.gif?raw=true)

## Import

In this example we are going to import users and realms from one Keycloak instance into another running in OpenShift. We can use the file generated above to do the import in another RHSSO instance.

##### Pre-Requisites

- [OpenShift Command-Line Client](https://github.com/openshift/origin/releases).
- [Logged into](https://docs.openshift.com/enterprise/3.2/cli_reference/get_started_cli.html) OpenShift Cluster up and running i.e., ``oc login``.


<a name="deploy"/>

### Deploying
Let's start by deploying a new RHSSO from scratch:

```sh
## Create instance
sh -c "$(curl -fsSL https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/deploy/deploy-rhsso-persistent.sh)"
```

This will deploy a minimal RHSSO with this configuration, [more info.](https://github.com/cesarvr/keycloak-examples/blob/master/deploy/deploy-rhsso-persistent.sh)


![starting](https://github.com/cesarvr/keycloak-examples/blob/master/docs/deploy-rhsso.gif?raw=true)

<a name="scaling_down"/>

### Scaling Down

Before we import any data we have to make sure that we are running just one replica of Keycloak just to avoid any race conditions.

To scale the pods to one we use [oc-scale](https://www.mankier.com/1/oc-scale):

```sh
  oc scale dc/sso --replicas=1
```

This change the required replicas for the deployment config named ``sso`` to ``1``.


<a name="mounting"/>

### Mounting File Into RHSSO Container

We need to insert the [RHSSO import file](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#export) created above inside the container. For that we can use the [ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#add-configmap-data-to-a-volume), this entity map a set of files into a volume to then we mount it as folder inside the container.

### Creating Volume

Syntax:

```sh
  oc create configmap <configmap-name> \
    --from-file=<file-with-our-keycloak-data>
```

Assuming the file we want to export is called ``keycloak-data.json`` and we are in the same folder:

```sh
 oc create configmap keycloak-data \
    --from-file=migrate.json

 # configmap/keycloak-data created
```

<a name="running"/>

### Mounting Volume

Now what we want to do is to mount this ConfigMap as a folder inside the Keycloak container.  

#### Easy Way

![](https://github.com/cesarvr/keycloak-examples/blob/master/import-export/img/mounting_volume.gif?raw=true)

> We first choose the source **keycloak-data**, then we map its content into a folder ``/var/data/`` inside the container, using the **Mount Path** section.


#### Hard Way

There is a hard way where you can use ``oc edit``:


First we need to target the deployment, let said is called ``sso``:

```sh
 oc edit dc/sso
```

Once there we need to go to the ```spec/containers/volumeMounts``` section:

```xml
spec:
  containers:
        - env:
            - name: DB_SERVICE_PREFIX_MAPPING
          ...
          volumeMounts:
            - mountPath: /var/data/
              name: my-import-data
            - mountPath: ...
```

Here ``mountPath`` is the folder inside the container, and ``name`` is the name of the **volume** that we are going to define below.  


Now we need to define our volume inside the same template, if is not there just create a new node called ``volumes`` at the same level that containers and add a new entry:

```xml
      ...
      containers:
      -
        ...
        ...
      volumes:
        - name: my-import-data
            configMap:
              name: keycloak-data
        - name: ...
       ...
```

We got ``name`` which is the name of our volume, referenced by ``volumeMount`` above, then just below we got our ConfigMap. Once you finish just exit the editor and the file should be updated.

To test that everything went well, we can check the contents of the folder ``/var/data/`` inside the container:

```sh
oc get pod
#
# your-keycloak-pod Running ....
#

oc exec your-keycloak-pod -- ls /var/data/
#migrate.json
```

We should be able to see our file there.

![](https://github.com/cesarvr/keycloak-examples/blob/master/import-export/img/check_volume.gif?raw=true)


## Running Container

When the [Keycloak image](https://access.redhat.com/containers/?tab=overview#/registry.access.redhat.com/redhat-sso-7/sso73-openshift) runs, it execute a script called ``openshift-launch.sh`` this script basically configures and execute Keycloak inside the container.

It also does an additional checks for an environment variable called ``SSO_IMPORT_FILE``, if this environment points to a RHSSO/Keycloak import file then it will try to proceed with the import.

```sh
...
...
if [ -n "$SSO_IMPORT_FILE" ] && [ -f $SSO_IMPORT_FILE ]; then
    $JBOSS_HOME/bin/standalone.sh -c standalone-openshift.xml -bmanagement 127.0.0.1 $JBOSS_HA_ARGS ${JBOSS_MESSAGING_ARGS} -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile
...
...
```

> This is the part where ``openshift-launch.sh`` checks for import files.

To declare this environment variable you can go to the dashboard or use ``oc-client``:

```sh
oc set env dc/sso SSO_IMPORT_FILE=/var/data/migrate.json
```

This should trigger the creation of a new pod, and this new pod as mentioned before will proceed to import the data:

```sh
  ...
  ...
	keycloak.migration.action = import
	keycloak.migration.file = /var/data/migrate.json
	keycloak.migration.provider = singleFile
	keycloak.migration.strategy = IGNORE_EXISTING
	line.separator =

  ...
  ...
```

![](https://github.com/cesarvr/keycloak-examples/blob/master/import-export/img/final.gif?raw=true)

> We successfully imported a new realm and a group of users.
