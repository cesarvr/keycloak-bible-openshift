## Customizing RHSSO Container

   * Getting Started
     - [Use Case](#use_case)
     - [How To Update The Configuration File](#update)
     - [Implementation](#impl)
        - [Downloading Files](#down)
        - [Running Commands Inside The Container](#container)
        - [Advantages](#adv)
        - [Running](#run)
     - [Complex Scenarios](#complex)
     - [RHSSO Configuration File Observations](#observe)

<a name="use_case"/>

## Use Case

In OpenShift Keycloak by default support horizontal scaling allowing pods to keep a session. But there is a small problem and is that Keycloak comes out-of-the-box only with support for **one cache owner** of the data, meaning that only one pod will keep the knowledge of the session for all the pods.

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/unsync-counting-down.gif?raw=true)

In this examplle we can observe a case what happen when the RHSSO cluster has only one cache owner, if we scale up we can keep the session for all our users, but if the owner of cache crash or get destroy then all users will get deauthenticated.

For some cases this is not bad, but if you more resillliency against failiures then you need to change the [configuration for session owners](https://www.keycloak.org/docs/2.5/server_installation/topics/cache/replication.html):

```xml
...
<subsystem xmlns="urn:jboss:domain:infinispan:4.0">
   <cache-container name="keycloak" jndi-name="infinispan/Keycloak">
     <distributed-cache name="sessions" mode="SYNC" owners="2"/>
     <distributed-cache name="authenticationSessions" mode="SYNC" owners="2"/>
      ...
```

In OpenShift we are dealing with immutable containers that can get destroyed without notice, so we need to look for a elegant way to apply this change.

<a name="update"/>



## How To Update The Configuration File

### Using ConfigMap

My first though was to use a [Config Map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/), but the problem is that when we mount it as volume it change the permissions of the folder to **read-only**, the problem with this is that RH-SSO do read/write in the configuration folder, and will crash because it won't be able to do its magic there.

Also by using a [Config Map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/) any new change will require to re-create the object again.

### Downloading Configuration Before Initialization

So my approach for this is to create a maintainable configuration file that will live in some place accessible from the container preferably a **Git repository** (but also an internal FTP or CDN Server will do the job).

Once we got that we can modify the pod initialization routine to grab the configuration file from the git server, place it into the configuration folder and then initiate the process as normal. Let's take do this step by step.



<a name="impl"/>

## Implementation


First we need to get our [DeploymentConfig](https://docs.openshift.com/enterprise/3.0/dev_guide/deployments.html):

```sh
oc get deploymentconfig # or dc for short

## Returns
#NAME             REVISION   DESIRED   CURRENT   TRIGGERED BY
#sso              25         1         1         config,image(redhat-sso72-openshift:1.2)
```

Here our [DeploymentConfig](https://docs.openshift.com/enterprise/3.0/dev_guide/deployments.html) is called ``sso``. Now we need to edit this configuration:

```sh
oc edit sso
```

> You can setup the editor of your choice by creating a environment variable OC_EDITOR


Once we load the template we need to jump to the ``spec/containers/`` section that should look similar to this, but with even more stuff:

```xml
...
containers:
- image: redhat-sso72-openshift@...
  imagePullPolicy: Always
  name: sso
  ...
```

This section defines a container named ``sso`` to be deployed by always pulling and image.



<a name="down"/>

### Downloading Configuration Files

What we want to do next is to pull the file from our git repository, you can do a ``curl`` like this:

```sh
curl -o  #<where-to-put-the-file> <https-server>
```

For this example I'm going to grab the file [from this Github URL](https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml) and place it configuration folder inside the container:


```sh
curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml
```

<a name="container"/>

### Running Commands Inside The Container

The majority of container images provided by OpenShift execute a process by default, what we want to do is to execute a custom command.

Here is an example of how to run a pod which executes a ``echo hello world!`` inside a ``busybox`` container:

```xml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
spec:
  containers:
  - name: myapp-container
    image: busybox
    command: ['sh', '-c', 'echo Hello World! && sleep 3600']
```

More about this topic [here](https://kubernetes.io/docs/concepts/workloads/pods/pod-overview/).

#### Download & Execute

Now that we got the tools let's replace the file and execute RHSSO, for this we need to open the editor using ``oc edit``:

 ```xml
 imagePullPolicy: Always
 name: sso
 command:['/bin/sh']
 args:['-c', 'curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/standalone-openshift.xml']
 ```

Here we are using ``curl`` to grab the static file from the Github HTTP server and we place this file into our folder, in a real scenario we change this with ``git clone`` or ``git pull``.

This will setup the configuration file in place for us, but we still need to execute the RH SSO main process we are going to add and ``&&`` for this.


```xml
imagePullPolicy: Always
name: sso
command:['/bin/sh']
args:['-c', 'curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/standalone-openshift.xml &&
/opt/eap/bin/openshift-launch.sh']
```

Every time now the pod is created it will grab the last version of the configuration file and will execute the ``/op/eap/bin/openshift-launch.sh``.


> ``/op/eap/bin/openshift-launch.sh`` script comes bundled with RHSSO image and it takes care of configure/starting up RHSSO main process inside the container.


<a name="run"/>

#### Running

![](https://github.com/cesarvr/keycloak-examples/blob/master/modifying-keycloak-cfg/docs/modifying.gif?raw=true)


> In this animation we can see that we are able to scale up and down and our [test-client]() can keep the session.


<a name="adv"/>

#### Advantages

Here are some extra advantages of using this approach:
- You decouple the configuration file from the container which improve your flexibility for future changes.
- If you choose to use a Git repository to save your file you can now [implement a Webhook](https://github.com/cesarvr/Openshift#webhook) to trigger an automatic deployment on new updates.




<a name="complex"/>

### More Complex Scenarios

They are cases where you need to execute more commands to get the work done, like do some pre-process or maybe modify another file. Here is an example where we need to download one configuration file, one script file and then run the process: 

```xml
name: sso
 image: rhsso@....
 command: ["/bin/sh", "-c", "curl -sSL https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/modify-import-mode.sh | sh"]
```

Here we stream and execute this file: 

```sh
main () {
 # copy fresh configuration file
 curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/standalone-openshift.xml

 # copy modified rhsso launcher
 curl -o /opt/eap/bin/openshift-launch.sh https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/openshift-launch.sh

 # execute launcher
 sh /opt/eap/bin/openshift-launch.sh
}

main 
```

This is more elegant and still compantible with webhooks for automatic deployment. 


<a name="observe"/>

### RHSSO Configuration File Observations

Early I mentioned that the ``/opt/eap/bin/openshift-launch.sh`` script makes some kind of pre-processing to the ``standalone-openshift.xml`` configuration file, this means that you cannot grab any configuration file and plug it into the container, you may need to copy a version of this file before the container start.

Instead of giving the instruction to retrieve this file before the container execute, I just going to leave the link for a [version here](https://github.com/cesarvr/keycloak-examples/blob/master/modifying-keycloak-cfg/src/standalone-openshift.xml).
