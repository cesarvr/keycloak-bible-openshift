## Red Hat Single Sign On Metrics

To expose RHSSO/Keycloak metrics to Prometheus we need the [keycloak-metrics-spi](https://github.com/aerogear/keycloak-metrics-spi) plugin, this powerful plugin expose to Prometheus Keycloak/RHSSO events such as logins and errors, and in the other hand you can see observe JVM telemetry data.  


## Metrics Module

The enterprise way to build this module is to write a Jenkins pipeline job to build the JAR and push it to a repository like Nexus.

![nexus](https://github.com/cesarvr/keycloak-examples/blob/master/docs/Screenshot%202019-05-29%20at%2013.15.57.png?raw=true)

Once we push the JAR file to Nexus we can modify our RHSSO deployment configuration to install this module via copying over the network or using a ConfigMap.

I didn’t have the patience to configure Jenkins or the compute resources (almost 4 GB+) to install those two packages. So I just hack a container to encapsulate this two operations (build & serve) in a container, consuming only 200 MiB RAM.

![hack](https://github.com/cesarvr/keycloak-examples/blob/master/docs/Screenshot%202019-05-29%20at%2013.15.46.png?raw=true)

### Building The Module

If you want to create the Nexus + Jenkins you can just jump to the install section. To create this **magic container** you need to execute this script:

```sh
oc create -f https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/prometheus/hack/pod.yml
```

> The script will configure the deployment of a OpenJDK-8 container, so make sure that your cluster have access to this image, otherwise [replace it](https://github.com/cesarvr/keycloak-examples/blob/master/prometheus/hack/pod.yml#L10) with your favorite Java base image.

Then the following actions are performed as part of the image deployment:

- Gradle gets installed.
- The [keycloak-metrics-spi](https://github.com/aerogear/keycloak-metrics-spi) project compiled/builded.
- The final JAR is served via HTTP port 8080.

### Visible To RHSSO

Now we need to expose our server to other members (RHSSO) of the cluster:

```sh
 oc create service clusterip metrics-builder --tcp=80:8080
```
> This basically creates a Hostname (**metrics-builder**) that will represent our container in the network, for more information take a look to [Kubernetes services.](https://kubernetes.io/docs/concepts/services-networking/service/)

Now containers in the same network can access the HTTP server of this container by doing:

```sh
curl http://metrics-builder/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar -o /opt/eap/providers/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar
```


### Install

And now the easy part, we should download the module from our container or Nexus and install it in the Wildfly/JBoss server.

To install we need to place this module inside the server folder, in the case of the RHSSO container the folder is:

```sh
$JBOSS_HOME/providers/

#or

/opt/eap/providers/
```

> If the providers folder is not there you need to create it.



We are going to perform the installation before the container execute the RHSSO process. This can be done by modify the deployment configuration:

```sh
## Get the Deployment Config
oc get dc/sso
# NAME             REVISION   DESIRED   CURRENT   TRIGGERED BY
# sso              49         1         1          …

## Modify
oc edit dc/sso
```

Go to the section ``containers > image`` section, then add a ``command`` field:

```xml
containers:
  name: sso
  image: rhsso@...
  command: ["/bin/sh", "-c"]
  ...
```

Just below command we are going to add a new field ``args`` with is an array of sequential operations we want the container to perform:

```xml
args: ["mkdir -p /opt/eap/providers"]
```

> The first action is to create the folder.



```xml
args: ["mkdir -p /opt/eap/providers",
       "curl http://metrics-builder/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar -o /opt/eap/providers/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar"]
```

> Then we download the module and copy it into the providers folder.


```xml
args: ["mkdir -p /opt/eap/providers",
       "curl http://metrics-builder/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar -o /opt/eap/providers/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar",
       "sh /opt/eap/bin/openshift-launch.sh"]
```

> Finally we execute the ``openshift.launch.sh``, this script is the one that boot up the RHSSO process.


#### More Elegant

Also you can create a [script](https://gist.github.com/cesarvr/a8b3e87befacfe80177044549a5a7811) and execute it before runtime:

```xml
args: ["curl -sSL https://gist.githubusercontent.com/cesarvr/a8b3e87befacfe80177044549a5a7811/raw/954d51ee6639db8b6160148163f5272d17074d15/run.sh | sh"]
```

> In this example we host the script in a [Github Gist](https://gist.github.com/cesarvr/a8b3e87befacfe80177044549a5a7811), then we stream and execute.


### Why Not Making An Image

The problem of hardcoding a particular module to a custom RHSSO image is doesn't scale well with future changes, take a look at our last example, we can make future modification and apply it to the container.

If we hardcode the configuration inside an image then you will need to remake the image each time configuration change, also this may require an update on the templates in charge of deploying the image.
