  - [Export](#use_case)
  - [Import](#update)
    - [Deploy](#deploy)
    - [Mounting File Into RHSSO Container](#mounting)
    - [Running Container](#running)

## Export

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

<a name="import"/>

### From A Container Running In OpenShift

##### Pre-Requisites

- [OpenShift Command-Line Client](https://github.com/openshift/origin/releases).
- [Logged into](https://docs.openshift.com/enterprise/3.2/cli_reference/get_started_cli.html) OpenShift Cluster up and running i.e., ``oc login``


#### Getting Started

We are going to use the configuration provided by the RHSSO container to export the information from the DB, to do that we need to down scale the pods to 1 to avoid race conditions:

```sh
  oc scale dc/sso --replicas=1
```

#### Updating Deployment

Replace the pod initial process, this way we can use start the export process manually, assuming our deployment configuration is called ``sso`` we should do:

```sh
 oc edit dc/sso
```

We jump to the section ``spec -> template -> spec -> containers -> first-container``:

```xml
spec:
  template:
    spec:
      containers:
        image: docker-registry.default.svc:5000/openshift/redhat-sso72-openshift
      - command:["/bin/sh" , "-c", "sleep 360`0"]
```

------
![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/initial-export.gif?raw=true)
------

Then trigger a new deployment:

```sh
 oc rollout latest dc/sso
```

#### Exporting To File

Now we need to check the new container created by the deployment:

```sh
oc get pods

#NAME            READY     STATUS    RESTARTS   AGE
#sso-8-bbb        0/1     Running      0       10sec
```

Notice the fact that ``READY`` flag is false, this is because the livenessProbe is not detecting the main process, but we can still login into the container as soon as we see the ``Running`` status:

```sh
oc rsh sso-8-bbb
# sh-4.2$
```

Once inside the container we can proceed with the export of data into a single file, this mode is compatible with the automatic import we are going to describe later.

If your container can access to internet you can use this two links:

#### curl

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/import-export/scripts/export.sh)"
```
#### wget

```sh
sh -c "$(wget https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/import-export/scripts/export.sh -O -)"
```

Otherwise you will need to execute this manually:

```sh
## build configuration file standalone-openShift.xml using container parameters.
source /opt/eap/bin/launch/openshift-common.sh
source /opt/eap/bin/launch/logging.sh
source /opt/eap/bin/launch/configure.sh

## Start RHSSO import mode
sh /opt/eap/bin/standalone.sh -c standalone-openshift.xml -bmanagement 127.0.0.1 -Dkeycloak.migration.action=export \
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/migrate.json | grep -i export
```

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



------
#### Example

* Exporting this users

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/users.png?raw=true)


![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/full-export.gif?raw=true)

> We start RHSSO in export mode, then we proceed to extract and stream the file with the RHSSO data out of the container.
------


## Import

In this example we are going to import users and realms from one Keycloak instance into another running in OpenShift.

##### Pre-Requisites

- [OpenShift Command-Line Client](https://github.com/openshift/origin/releases).
- [Logged into](https://docs.openshift.com/enterprise/3.2/cli_reference/get_started_cli.html) OpenShift Cluster up and running i.e., ``oc login``.


<a name="deploy"/>

##### Deploying
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
    --from-file=kc-export.json

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
#kc-export.json
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
oc set env dc/sso SSO_IMPORT_FILE=/var/data/kc-export.json
```

This should trigger the creation of a new pod, and this new pod as mentioned before will proceed to import the data:

```sh
  ...
  ...
	keycloak.migration.action = import
	keycloak.migration.file = /var/data/kc-export.json
	keycloak.migration.provider = singleFile
	keycloak.migration.strategy = IGNORE_EXISTING
	line.separator =

  ...
  ...
```

![](https://github.com/cesarvr/keycloak-examples/blob/master/import-export/img/final.gif?raw=true)

> We successfully imported a new realm and a group of users.
