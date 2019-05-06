## Export

Exporting information in Keycloak is *trivial*, as the [documentation](https://www.keycloak.org/docs/2.5/server_admin/topics/export-import.html) state we just need to locate the ``standalone.sh`` script and execute as follows: 


```sh
bin/standalone.sh -Dkeycloak.migration.action=export
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/var/tmp/keycloak-data.json
```

This will export all Keycloak resources (realms, user, clients, etc) into a single file, until there everything is fine. But how do we export into a container running in OpenShift. 


### External DB

If you have a external database this is as simple as to turn down any running Keycloak pods connected to that DB and execute an external Keycloak connected to this DB: 

```sh
bin/standalone.sh -c <same-configuration-as-pod> -Dkeycloak.migration.action=import
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/var/tmp/keycloak-data.json
-Dkeycloak.migration.strategy=OVERWRITE_EXISTING
``` 

If you use the same configuration then this should update the same database and you are set, now you just need to spin up your containers and you are done. In this particular case we are going to obtain a file called ``keycloak-data.json``, now we need to import this data into another Keycloak instance running in OpenShift. 

### Import 

![starting](https://github.com/cesarvr/keycloak-examples/blob/master/import-export/img/begin.gif?raw=true)

In this example we are going to import data from one Keycloak instance into another running in OpenShift.  

### Scaling Down 

Before we start make sure that you are running just one replica of Keycloak as this way you will avoid problems of multiple container updating the DB at the same time. 

Let's assume our Keycloak containers are being deployed by ``my-sso`` deployment configuration: 

```sh
  oc scale dc/my-sso --replicas=1
```

### Pushing Export File

We can now proceed to push the imported json file into the container running Keycloak, let's do this by using a [ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#add-configmap-data-to-a-volume).

To make a ConfigMap we can use oc-client like this: 

```sh
  oc create configmap <configmap-name> --from-file=<file-with-our-keycloak-data>
```

Assuming the file we want to export is called ``keycloak-data.json`` and we are in the same folder: 

```sh 
 oc create configmap keycloak-data --from-file=kc-export.json
 configmap/keycloak-data created
```


### Mounting The ConfigMap

Now what we want to do is to mount this ConfigMap as a folder inside the Keycloak container.  

#### Easy Way 

![](https://github.com/cesarvr/keycloak-examples/blob/master/import-export/img/mounting_volume.gif?raw=true)

The easiest way is to use the OpenShift UI console, go to the deployment configuration of our Keycloak, section configuration/add config file.


#### Hard Way 

There is a hard way where you can use ``oc edit`` command it goes as follow: 


First we need to target the deployment, let said is called ``sso``: 

```sh
 oc edit dc/sso
```

Once there we need to go to the spec/containers/volumeMounts section: 

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


### Importing... 

When the [Keycloak image](https://access.redhat.com/containers/?tab=overview#/registry.access.redhat.com/redhat-sso-7/sso73-openshift) runs, it execute a script called ``openshift-launch.sh`` this script basically configures and execute Keycloak inside the container, aside of that it checks for an environment variable called ``SSO_IMPORT_FILE`. 

```sh
...
...
if [ -n "$SSO_IMPORT_FILE" ] && [ -f $SSO_IMPORT_FILE ]; then
    $JBOSS_HOME/bin/standalone.sh -c standalone-openshift.xml -bmanagement 127.0.0.1 $JBOSS_HA_ARGS ${JBOSS_MESSAGING_ARGS} -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile
...
...
```

So let's declare : this environment variable you can go to the dashboard and do it *graphically* or you can also do it using ``oc-client`` like this: 

```sh
oc set env dc/sso SSO_IMPORT_FILE=/var/data/kc-export.json
```

This should trigger the creation of a new container and if you see the logs you can see that the script will pick up our file and do the import. 

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



















 


















