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

#### curl

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/import-export/scripts/export.sh)"
```
#### wget

```sh
sh -c "$(wget https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/import-export/scripts/export.sh -O -)"
```


## Import

In this example we are going to import users and realms from one Keycloak instance into another running in OpenShift.

##### Pre-requisites

- [Openshift Command-Line Client](https://github.com/openshift/origin/releases).
- Openshift Cluster up and running.

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
