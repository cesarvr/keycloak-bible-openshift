## Export

Exporting information in Keycloak is *trivial*, as the [documentation state](https://www.keycloak.org/docs/2.5/server_admin/topics/export-import.html) we just need to locate the ``standalone.sh`` script and execute as follows: 


```sh
bin/standalone.sh -Dkeycloak.migration.action=export
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/var/tmp/keycloak-data.json
```

This will export all Keycloak resources (realms, user, clients, etc) into a single file, until there everything is fine. But how do we export into a container running in OpenShift. 


### External DB

If you have a external database this is as simple as to turn down any running Keycloak pods and execute an external Keycloak using: 

```sh
bin/standalone.sh -c <same-configuration-as-pod> -Dkeycloak.migration.action=import
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/var/tmp/keycloak-data.json
-Dkeycloak.migration.strategy=OVERWRITE_EXISTING
``` 

If you use the same configuration then this should update the same database and you are set, now you just need to spin up your containers and you are done. 




### DB Running In OpenShift

If your data base is running inside containers in OpenShift and you are using something similar to Red Hat Persistence template, then you need to change your approach a little bit. 

Before we start make sure that you are running just one replica of Keycloak this way you will avoid problems of multiple container updating the DB. 

Let's assume our Keycloak containers are being deployed by ``my-sso`` deployment configuration: 

```sh
  oc scale dc/sso-bak --replicas=1
```


Now that we got only one replica, we can now proceed to push the imported json file into the container running Keycloak let's do this by using a [ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#add-configmap-data-to-a-volume).

First let's define the ConfigMap: 

Assuming the file we want to export is called ``keycloak-data.json``: 

```sh 
 oc create configmap keycloak-import-file --from-file=keycloak-data/kc-export.json
```






 


















