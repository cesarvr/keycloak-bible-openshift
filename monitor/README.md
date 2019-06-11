<a name="audit"/>

## Auditing and Performance
- [Using Prometheus](#prometheus)
  - [Building The Metrics Module](#EE)
    - [Enterprise Way](#building)
    - [Like Wozniak](#hacker)
  - [Installing The Module](#install)
    - [Using ConfigMaps](#configmap)
  - [Exposing Metrics](#expose)
  - [Why Not Making An Image Instead ?](#dockerfile)


### Auditing

A very important feature of Keycloak/RHSSO is the [audit system](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.2/html/server_administration_guide/auditing_and_events) which provides observability around the users activity in the server.   
 
<img align="center" src="https://github.com/cesarvr/keycloak-examples/blob/master/docs/events.png?raw=true" width="500">

> RHSSO events console.

This audit system can be managed in the **Events** section inside the RHSSO Console, there you can manage the events you want to watch, actions to take (like sending a email) and plugins. And thats another great news because you can extend this system by writing your own plugins.  

<a name="prometheus"/>

## Prometheus

Prometheus is a popular time series database used to collect and store metrics from microservices, then this data can be visualized using other tools like Grafana. The advantage of this is that visualization is decouple from data collection or in other words we can use the best tools for each job. 
 
In this guide we are going to integrate the Red Hat SSO with Prometheus, using the excellent **keycloak-metrics-spi** plugin, this plugin not only expose audit or events, but it also expose JVM performance metrics giving us a complete picture of the identity provider. 

> [For more information about keycloak-metrics-spi plugin](https://github.com/aerogear/keycloak-metrics-spi).


<a name="building"/>

### Building The Metrics Module

<a name="EE"/>

#### Enterprise Way

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
oc create -f https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/monitor/hack/pod.yml
```

> The script will configure the deployment of a OpenJDK-8 container, so make sure that your cluster have access to this image, otherwise [replace it](https://github.com/cesarvr/keycloak-examples/blob/master/monitor/hack/pod.yml#L10) with your favorite Java base image.

That line above creates a container and:

- Install Gradle.
- Clone [keycloak-metrics-spi](https://github.com/aerogear/keycloak-metrics-spi) project.
- Compile the project and generate a JAR binary.
- Serve the binary via HTTP port 8080.


> The source code can be [found here](https://github.com/cesarvr/keycloak-examples/blob/master/monitor/hack/pod.yml).



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

## Installing The Module

By now we should have access to a server storing our binary, being Nexus or the Metric Builder container. 

Now the next step is to download the module from one of this servers and place it inside the SSO container into the ``$JBOSS_HOME/providers/`` folder.

> If the providers folder is not there you need to create it.

### Changing Deployment Rules

We need to specify some new steps before the SSO gets up and running, the best place to define this rules is the deployment configuration.

Let's customize our deployment configuration: 


```sh
## Get the Deployment Config
oc get dc/sso

# NAME             REVISION   DESIRED   CURRENT   TRIGGERED BY
# sso              49         1         1          …
```
> Retrieve the [DeploymentConfig](https://docs.openshift.com/enterprise/3.0/dev_guide/deployments.html)

Modify it using [oc-edit](https://docs.openshift.com/enterprise/3.0/cli_reference/basic_cli_operations.html): 

```sh 
## Modify
oc edit dc/sso
```

Navigate through the template to the section ``containers > image`` section, then add a ``command`` field:

```xml
containers:
  name: sso
  image: rhsso@...
  command: ["/bin/sh", "-c"]
  ...
```

Then just add a new ``args`` field just below that with the followin content: 

```xml
  ...
  image: rhsso@...
  command: ["/bin/sh", "-c"]
  args: ["curl -sSL https://gist.githubusercontent.com/cesarvr/a8b3e87befacfe80177044549a5a7811/raw/954d51ee6639db8b6160148163f5272d17074d15/run.sh | sh"]
  ...
```

> In this example we host the script in a [Github Gist](https://gist.github.com/cesarvr/a8b3e87befacfe80177044549a5a7811), then we stream and execute.

This script does the following: 

- It creates the providers folder ``/opt/eap/providers``.
- Download the compiled module from Metrics Builder container created above. 
- Execute the RHSSO process.

### Using Internal Repository

If you don't want this script to be stored publicly you can store it in your own self-served git repository like [Gogs](https://gogs.io/) running on your OpenShift cluster.

### Hard Way

If you don't have the luxury of having access to a Git repository, you can hardcode those instructions like this: 

```xml
 image: rhsso@...
  command: ["/bin/sh", "-c"]
  args: [
    "mkdir -p /opt/eap/providers",
    "curl http://metrics-builder/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar -o /opt/eap/providers/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar",
    "sh /opt/eap/bin/openshift-launch.sh"
  ]
  ...
```
> Use this method just for learning purposes. 


<a name="configmap"/>

### Alternative Using ConfigMaps

Another way to inject this module into the RHSSO container is to build the binary JAR file using the Jenkins pipeline method and save it inside a [ConfigMap](https://docs.openshift.com/enterprise/3.2/dev_guide/configmaps.html).

Then we just need to mount the [ConfigMap](https://docs.openshift.com/enterprise/3.2/dev_guide/configmaps.html) inside the RHSSO container.


> For more instructions on how to create and mount a ConfigMap [follow this example](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#mounting-file-into-rhsso-container).

<a name="expose"/>

## Exposing Metrics

Now you we just need to rollout a new deployment:

```sh
oc rollout latest dc/sso
#deploymentconfig.apps.openshift.io/sso rolled out
```
> Basically we create new container that will execute [our deployment script]((https://gist.github.com/cesarvr/a8b3e87befacfe80177044549a5a7811)).

Once the container is deployed, you can now go to the ``Master`` realm, Events section, Config and select the metrics module should appear in the [Events Listener](Event Listener SPI) field.

### Quick Tour
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

## Why Not Making An Image Instead ?

The problem of hardcoding a particular configuration to a docker image is that it usually doesn't scale well with future changes, meaning that your ``Dockerfile`` will grow in size and complexity.

But isolating the deployment steps in a script we get the following advantages:

- **Decoupling**
  - By isolating image creation from the actions after deployment.
- **More maintainable** 
  - You just write deployment actions.
- **More options** 
  - Use a real programming language like Python instead of using BASH or Dockerfile.
- **Decompose** 
  - Brake complex features in different files (if needed), instead of having a huge file.
- **Automate** 
  - Make automatic deployment of new changes via [Webhooks](https://github.com/cesarvr/Openshift#webhook).


### [For a more complex example](https://github.com/cesarvr/keycloak-examples/blob/master/modifying-keycloak-cfg/src/modify-import-mode.sh).

In that example the script does:

- It replace the ``standalone.sh`` with a custome version.
- Copy some configuration files.
- Download the [keycloak-metrics-spi plugin](https://github.com/aerogear/keycloak-metrics-spi).
