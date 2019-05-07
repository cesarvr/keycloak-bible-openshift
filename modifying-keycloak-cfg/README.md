## Customizing RHSSO Container

   * Getting Started
     - [Use Case](#use_case)
     - [Updating Configuration File](#update)
     - [Complex Scenarios](#complex)
     - [RHSSO Configuration File Observations](#observe)

<a name="use_case"/>

### Use Case

In OpenShift Keycloak by default support horizontal scaling allowing pods to keep a session. But there is a small problem and is that Keycloak out-of-the-box only support one *owner* of the data, meaning that only one pod will keep the sessions state, if this pod crash the session knowledge is lost and it will start again.

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/unsync-counting-down.gif?raw=true)

In this examplle we can observe a case what happen when the RHSSO cluster has only one cache owner, if we scale up we can keep the session for all our users, but if the owner of cache crash we deauthenticate all users. To change this we need to modify the RHSSO configuration.

One way to deal with this is to [modify the amount session owners](https://www.keycloak.org/docs/2.5/server_installation/topics/cache/replication.html), we can do that by modifying the ``distributed-cache`` [parameter in the RHSSO configuration](https://github.com/cesarvr/keycloak-examples/blob/master/modifying-keycloak-cfg/standalone-openshift.xml#L222):

```xml
...
<subsystem xmlns="urn:jboss:domain:infinispan:4.0">
   <cache-container name="keycloak" jndi-name="infinispan/Keycloak">
     <distributed-cache name="sessions" mode="SYNC" owners="2"/>
     <distributed-cache name="authenticationSessions" mode="SYNC" owners="2"/>
      ...
```
Here we bumped the sessions owner to ``2``, this affect the resiliency of our cluster against accidents, but there is a catch, we are dealing with containers here, so making this small update is not trivial.

<a name="update"/>

### Updating Configuration File

#### Using ConfigMap
My first though was to use a [Config Map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/), but the problem is that when we mount it as volume it change the permissions of the folder to **read-only**, the problem with this is that RH-SSO do read/write in the configuration folder, and will crash because it won't be able to do its magic there.

Also by using a [Config Map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/) any new change will require to re-create the object again. 

### Downloading Configuration Before Initialization

So my approach for this is to create a maintainable configuration file that will live in some place accessible from the container preferably a **Git repository** (but also an internal FTP or CDN Server will do the job).

Once we got that we can modify the pod initialization routine to grab the configuration file from the git server, place it into the configuration folder and then initiate the process as normal. Let's take do this step by step.

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

#### Downloading Configuration Files

What we want to do next is to pull the file from our git repository, you can do a ``curl`` like this:

```sh
curl -o  #<where-to-put-the-file> <https-server>
```

For this example I'm going to grab the file [from this Github URL](https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml) and place it configuration folder inside the container:


```sh
curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml
```

#### Running Commands Inside The Container

The majority of container images provided in OpenShift comes with a implicit command to be executed when the image is deployed as a way to hide this complexity from the user, but for this case in particular we want to take control of how this image is executed.

If you navigate to the section ``spec/containers/`` in the deployment configuration template

```xml
imagePullPolicy: Always
name: sso
command:['/bin/sh']
args:['-c', 'echo Hello World']
```

If we save this any time OpenShift want to start the container it will execute a ``hello world``.


#### Download & Execute

Now that we got the tools let's replace the file and execute RHSSO, for this we need to open the editor using ``oc edit``:

 ```xml
 imagePullPolicy: Always
 name: sso
 command:['/bin/sh']
 args:['-c', 'curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml']
 ```

Here we are using ``curl`` to grab the static file from the Github HTTP server and we place this file into our folder, in a real scenario we change this with ``git clone`` or ``git pull``.

This will setup the configuration file in place for us, but we still need to execute the RH SSO main process we are going to add and ``&&`` for this.


```xml
imagePullPolicy: Always
name: sso
command:['/bin/sh']
args:['-c', 'curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml &&
/opt/eap/bin/openshift-launch.sh']
```

Every time now the pod is created it will grab the last version of the configuration file and will execute the ``/op/eap/bin/openshift-launch.sh``, this file comes with the RHSSO image and is a script that takes care of starting up RHSSO main process inside the container.


Here are some extra advantages of using this approach:
- You decouple the configuration file from the container which improve your flexibility for future changes.
- If you choose to use a Git repository to save your file you can now [implement a Webhook](https://github.com/cesarvr/Openshift#webhook) to trigger an automatic deployment on new updates.




<a name="complex"/>

### More Complex Scenarios

They are cases where you need to execute more commands to get the work done, like do some pre-process of the configuration template using internal parameters only available to the container at run-time. I those cases I won't recommend the use of ``&&`` ad infinitum, I think a good rule is to keep it below or equal two lines.

In more complex cases, you would prefer to save the execution script remotely and do something like:

```xml
name: sso
 command:
 - /bin/sh
 args:
 - c
 - curl -fsSL my-static-server/keycloak/execute.sh
```

And put the complicate logic in a maintainable remote script under your control.



<a name="observe"/>

### RHSSO Configuration File Observations

Early I mentioned that the ``/opt/eap/bin/openshift-launch.sh`` script makes some kind of pre-processing to the ``standalone-openshift.xml`` configuration file, this means that you cannot grab any configuration file and plug it into the container, you may need to copy a version of this file before the container start.

Instead of giving the instruction to retrieve this file before the container execute, I just going to leave the link for a [version here](https://github.com/cesarvr/keycloak-examples/blob/master/modifying-keycloak-cfg/standalone-openshift.xml).
