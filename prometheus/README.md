<a name="audit"/>

## Auditing and Events
- [Using Prometheus](#prometheus)
  - [Requirements](#req)
  - [Building The Metrics Module](#EE)
    - [Enterprise Way](#building)
    - [Like Wozniak](#hacker)
  - [Install](#install)
    - [Using ConfigMaps](#configmap)
  - [Exposing Metrics](#expose)
  - [Why Not Making An Image Instead ?](#dockerfile)






One of the features of Keycloak/RHSSO is the audit console which offers a convenient way to see the transactions in the identity server.

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/events.png?raw=true)

> RHSSO events console.

In this console you can monitor see what's happening inside your identity provider like login errors, expiring token, invalid clients, etc. This console is perfect to detect failures or suspicious activities. 

<a name="prometheus"/>

## Prometheus

In this guide we are going to discuss how we can expose internal RHSSO usage information such as [Events](https://www.keycloak.org/docs/3.2/server_admin/topics/events.html) and JVM telemetry, to Prometheus.

To achieve this we are going to use the **keycloak-metrics-spi** plugin which extends Keycloak/RHSSO event system and expose this data via the ``/metrics`` endpoint which is then scraped by the Prometheus server.

> [For more information about this plugin](](https://github.com/aerogear/keycloak-metrics-spi)).

<a name="req"/>

### Requirements

This guide assumes that you have Keycloak/RHSSO and Prometheus running in your OpenShift cluster.

<a name="building"/>

### Building The Metrics Module

<a name="EE"/>

#### Enterprise Way

The enterprise way to build this module is to write a [OpenShift Jenkins pipeline job](https://github.com/cesarvr/Spring-Boot), then we push the compiled binary JAR into a repository like Nexus.

![nexus](https://github.com/cesarvr/keycloak-examples/blob/master/docs/Screenshot%202019-05-29%20at%2013.15.57.png?raw=true)

Then we make some modification into the RHSSO container to grab and install the module, if you prefer to build the module using this way you can jump to the [install section](##install).


<a name="hacker"/>

#### Hackers Way

I didn’t have the patience nor the resources (about ≈4 GB+) in my cluster required to install Jenkins and Nexus, so I end up crafting a small container to perform this two operations (build & serve) using only 200 MiB RAM (200MB RAM is still excessive, but that's how memory hungry the Gradle build tool is).

![hack](https://github.com/cesarvr/keycloak-examples/blob/master/docs/Screenshot%202019-05-29%20at%2013.15.46.png?raw=true)


### Building The Module

I'm create a small script to create this **magic container**:

```sh
oc create -f https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/prometheus/hack/pod.yml
```

> The script will configure the deployment of a OpenJDK-8 container, so make sure that your cluster have access to this image, otherwise [replace it](https://github.com/cesarvr/keycloak-examples/blob/master/prometheus/hack/pod.yml#L10) with your favorite Java base image.

The source spells for this magic can be [found here](https://github.com/cesarvr/keycloak-examples/blob/master/prometheus/hack/pod.yml).

Then the following actions are performed as part of the image deployment:

- Installation of Gradle.
- We clone [keycloak-metrics-spi](https://github.com/aerogear/keycloak-metrics-spi) project.
- Compile the project and generate a JAR binary.
- Serve it via HTTP port 8080.

### Exposing The Metrics Binary To RHSSO

Now we need to expose this JAR server to the RHSSO pod:

```sh
 oc create service clusterip metrics-builder --tcp=80:8080
```
> This basically creates a Hostname (**metrics-builder**) that will represent our container in the network, for more information take a look to [Kubernetes services.](https://kubernetes.io/docs/concepts/services-networking/service/)

If we deployed our **metrics-builder** container in the same namespace as the RHSSO we can then test this by login into the RHSSO like this:

```sh
# Login into the RHSSO container.
oc rsh sso-pod-1

# Making a HTTP Request to the [ metrics-builder ] container.
curl -Is http://metrics-builder/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar

HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/2.7.5
Date: Mon, 10 Jun 2019 15:46:57 GMT
Content-type: application/octet-stream
Content-Length: 89621
Last-Modified: Thu, 30 May 2019 15:25:16 GMT
```

> We making a HTTP request from RHSSO to the Metrics-Builder container.



<a name="install"/>

### Install

The last step is to install the module, to do this first we need to download it from our two options the **metrics-builder** or **Nexus Repository** and then place the binary inside Wildfly/JBoss ``providers`` folder:

```sh
$JBOSS_HOME/providers/
#or
/opt/eap/providers/
```

> If the providers folder is not there you need to create it.


We have to this just before the containers start, so let's edit the containers start routine in the deployment configuration:  

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

Just below command we are going to add a new field ``args`` wich is an array of sequential operations we want the container to perform in order:

First create a ``providers`` folder:

```xml
args: ["mkdir -p /opt/eap/providers"]
```

> The first action is to create the folder.


Download the JAR binary file:

```xml
args: ["mkdir -p /opt/eap/providers",
       "curl http://metrics-builder/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar -o /opt/eap/providers/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar"]
```

Launch RHSSO main process ``openshift-launch.sh``:

```xml
args: ["mkdir -p /opt/eap/providers",
       "curl http://metrics-builder/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar -o /opt/eap/providers/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar",
       "sh /opt/eap/bin/openshift-launch.sh"]
```

#### More Elegant

Also you consolidate all those ugly lines into one elegant [script](https://gist.github.com/cesarvr/a8b3e87befacfe80177044549a5a7811) and replace those ``args`` entry with this one liner:

```xml
args: ["curl -sSL https://gist.githubusercontent.com/cesarvr/a8b3e87befacfe80177044549a5a7811/raw/954d51ee6639db8b6160148163f5272d17074d15/run.sh | sh"]
```

> In this example we host the script in a [Github Gist](https://gist.github.com/cesarvr/a8b3e87befacfe80177044549a5a7811), then we stream and execute.

This script can be stored and maintained inside in your own self-served git repository like [Gogs](https://gogs.io/) running on your premises. And guess what OpenShift will make that is always available.


<a name="configmap"/>

#### Another Option

Another way to inject the module into the RHSSO container is to build the binary JAR file and save it inside a [ConfigMap](https://docs.openshift.com/enterprise/3.2/dev_guide/configmaps.html).

Then we just need to mount the [ConfigMap](https://docs.openshift.com/enterprise/3.2/dev_guide/configmaps.html) inside the RHSSO container.


> For more information on how to create and mount a ConfigMap [follow this example](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#mounting-file-into-rhsso-container).

<a name="expose"/>

### Exposing Metrics

Now you we just need to rollout a new deployment:

```sh
oc rollout latest dc/sso
#deploymentconfig.apps.openshift.io/sso rolled out
```

Once you restart you need to login into RHSSO/Keycloak, go to the ``Master`` realm, Events section, Config and select the metrics module should appear in the [Events Listener](Event Listener SPI) field.

#### Quick Tour
![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/module-install.gif?raw=true)

----------

Now you can [point Prometheus](https://prometheus.io/docs/prometheus/latest/getting_started/) to your RHSSO ``metrics`` endpoint:

```sh
curl https://my-rhsso-server.com/auth/realms/master/metrics | grep memory

#...
#jvm_memory_pool_bytes_max{pool="PS Old Gen",} 1.75112192E8
# HELP jvm_memory_pool_bytes_init Initial bytes of a given JVM memory pool.
# TYPE jvm_memory_pool_bytes_init gauge
#jvm_memory_pool_bytes_init{pool="Code Cache",} 2555904.0
#jvm_memory_pool_bytes_init{pool="Metaspace",} 0.0
#jvm_memory_pool_bytes_init{pool="Compressed Class Space",} 0.0
#jvm_memory_pool_bytes_init{pool="PS Eden Space",} 1.6777216E7
#jvm_memory_pool_bytes_init{pool="PS Survivor Space",} 2621440.0
#jvm_memory_pool_bytes_init{pool="PS Old Gen",} 4.5088768E7
#
#
```

<a name="dockerfile"/>

### Why Not Making An Image Instead ?

The problem of hardcoding a particular configuration to a docker image is that it usually doesn't scale well with future changes, meaning that your ``Dockerfile`` will grow in size and complexity.

But isolating the deployment steps in a script we get the following advantages:

- **Decoupling** By isolating image creation from image deployment in two separated scripts or in the case of OpenShift just one script for deployment as we did before.
- **More maintainable** You just write deployment actions.
- **More options**, You can use a real programming language like Python2/3, if available in the container (like in RHSSO container) instead of using BASH.
- **Decompose** Brake complex features in different files (if needed), instead of having a huge file.
- **Automate** Make automatic deployment of new changes via [Webhooks](https://github.com/cesarvr/Openshift#webhook).


#### [For a more complex example](https://github.com/cesarvr/keycloak-examples/blob/master/modifying-keycloak-cfg/src/modify-import-mode.sh).

In that example the script does:

- It replace the ``standalone.sh`` with a custome version.
- Copy some configuration files.
- Download the [keycloak-metrics-spi plugin](https://github.com/aerogear/keycloak-metrics-spi).
