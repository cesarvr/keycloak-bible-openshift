## Configuration Changes At Pre-Startup

In OpenShift Keycloak by default support horizontal scaling allowing pods to keep a session. But there is a small problem and is that Keycloak out-of-the-box only support one *owner* of the data, meaning that only one pod will keep the sessions state, if this pod crash this knowledge is lost and it will start again. From the point of view of the users they will lost their session and need to login again.

One way to deal with this is to [modify the amount session owners](https://www.keycloak.org/docs/2.5/server_installation/topics/cache/replication.html), we can do that by modifying the ``distributed-cache`` property values in the configuration file (like [standalone-openshift.xml]()):

```xml

<subsystem xmlns="urn:jboss:domain:infinispan:4.0">
   <cache-container name="keycloak" jndi-name="infinispan/Keycloak">
     <distributed-cache name="sessions" mode="SYNC" owners="2"/>
     <distributed-cache name="authenticationSessions" mode="SYNC" owners="2"/>
     <distributed-cache name="offlineSessions" mode="SYNC" owners="2"/>
     <distributed-cache name="clientSessions" mode="SYNC" owners="2"/>
     <distributed-cache name="offlineClientSessions" mode="SYNC" owners="2"/>
     <distributed-cache name="loginFailures" mode="SYNC" owners="2"/>
```

In this sample we defined ``2`` owners of the session data, improving the resiliency of our cluster against accidents, but there is a catch we are dealing with containers, so making this small update is not trivial.

### Updating Configuration File

My first though was to use a [Config Map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/), but the problem is that this volume mount a Read-Only file system and RH-SSO do some read and write in that folder. By using this method the server will fail to boot up, also I wanted a way to easily update the configuration file.

My approach for this is to create a maintainable configuration file that will live in some place accessible from the container (like a git repository, internal FTP, CDN, etc) and then modify the pod initialization routine to update the configuration with a copy of this file before starting the container, let's see how we do that.

Let's get the [DeploymentConfig](https://docs.openshift.com/enterprise/3.0/dev_guide/deployments.html):

```sh
oc get deploymentconfig # or dc for short

## Returns
#NAME             REVISION   DESIRED   CURRENT   TRIGGERED BY
#sso              25         1         1         config,image(redhat-sso72-openshift:1.2)
```

We see our [DeploymentConfig](https://docs.openshift.com/enterprise/3.0/dev_guide/deployments.html) is called ``sso``. Then let's edit this configuration:

```sh
oc edit sso
```

> You can setup the editor of your choice by creating a environment variable OC_EDITOR


Once here we just jump to the ``containers`` section that looks similar to this:

```xml
containers:
- image: redhat-sso72-openshift@...
  imagePullPolicy: Always
  name: sso
```

This section defines a container named ``sso`` to be deployed by always pulling and image. Now we need to add this:

First we want to take control of the command executed by the container:

```xml
imagePullPolicy: Always
name: sso
 command:
 - /bin/sh
 args:
 - c
 - curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml
```

Here we are using ``curl`` to grab the static file from the Github HTTP server and we place this file into our folder, in a real scenario we change this with ``git clone`` or ``git pull``.

This will setup the configuration file in place for us, but we still need to execute the RH SSO main process we are going to add and ``&&`` for this.


```xml
 - curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml &&
 /opt/eap/bin/openshift-launch.sh
```

RHSSO image comes with a script that does a lot of tricks to start the server and this script also modify the initial ``standalone-openshift.xml``, what we did here is just to execute that script:

```sh
/opt/eap/bin/openshift-launch.sh
```

#### What If I Need More Complexity

They are cases where you need to execute more commands to get the work done, like do some pre-process of the configuration template using internal parameters only available to the container at run-time. I those cases I won't recommend the use of ``&&`` ad infinitum, I think a good rule is to keep it below or equal two lines. 

In those cases you can save the execution script remotely and do something like: 

```xml
name: sso
 command:
 - /bin/sh
 args:
 - c
 - curl -fsSL my-static-server/keycloak/execute.sh
```

And put the complicate logic in a maintainable remote script under your control. 













