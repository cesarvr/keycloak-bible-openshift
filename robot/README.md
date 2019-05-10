## Testing Keycloak/Red Hat SSO Deployment in Openshift

To test any miss configuration I wrote a simple OAuth2 service included in this folder that can be handy to help you test your RHSSO configuration.

### Prerequisites

Before we start you need to deploy a RHSSO instance and [configure a user/realm/client](https://www.keycloak.org/docs/latest/getting_started/index.html#_install-boot).

### Installing The Service

This service is written in the Node.js:

```sh
 git clone https://github.com/cesarvr/keycloak-examples
 cd robot/

 npm install
 node index.js --deploy --memory 80
```

You are done.


### With Docker

If you don't want to install Node.js, you can still install this service with docker:

Jump inside the folder and do:

```sh
docker build -t deploy-me .
```

This will create and image then you just execute this image using:

```sh
docker run -it deploy-me
```

Here is a full example:

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/docker-deployment.gif?raw=true)



### Remove

To remove the service from the cluster once you finish you just need to run:

```sh
node index --remove
```
To remove the docker version:

```sh
docker run -it deploy-me node index.js --remove
```

## Configuration

Once this service is deployed it will require this environment variables to work:

- ``SSO`` URL to Keycloak instance.
- ``ROUTE`` The URL of this service once deployed.
- ``CLIENT_SECRET`` The [secret id](https://www.keycloak.org/docs/2.5/server_admin/topics/clients/oidc/confidential.html) between Keycloak and client.
- ``REALM`` A Keycloak realm.

You can use ``oc set env`` for this example:

```sh
  oc login
  oc project <your-namespace>
  oc set env deploy robot-auth SSO=my-keycloak.domain
  oc set env deploy robot-auth CLIENT_SECRET=my-client
  ...
```

## Hard Way

### Manual Deployment Configuration

In some Linux distributions the TTY is not compatible with okd-runner, but you can still use the self-deploy capability by writing the configuration file yourself, just make a file called ``._cfg.conf`` with the following JSON content:

```json
{
    "cluster": "hostname-api-server",
    "user": "<your-user>",
    "password": "<your-password>",
    "strictSSL": false,
    "namespace": "namespace"
}
```


Or you can also use a token:

```json
{
    "cluster": "https://my-openshift-server:port",
    "namespace": "testing",
    "token": "NSvPJQk7sHhJ.......................",
    "strictSSL": false
}
```

Save this file in the same folder as this project and then execute deploy:

```sh
  node index.js --deploy --memory 80
```
> You can use this configuration file in conjunction with docker build method we discuss previously.

### With Docker

This project also includes a ``Dockerfile``, so if you have docker you don't need to install anything just run:


Make an image:

```sh
docker build -t deployer .
```

Run the image

```sh
docker run -it deployer
```

## Using OC Client

You can start by installing [oc-client](https://github.com/cesarvr/Openshift#linuxmacosx). Once you install it you can login into your cluster and create a new [*binary build*](https://cesarvr.io/post/buildconfig/):


To create the build:

```sh
oc new-build nodejs --binary=true --name=webui
```


Assuming your are in the ``/robot`` folder, you can now deploy your local code into the **build**:

```sh
oc start-build bc/webui --from-file=.
```


Now you can create a deployment configuration:

First get the image:

```sh
 oc get is

 # NAME         DOCKER REPO                                             TAGS      UPDATED
 # webui        docker-registry.default.svc:5000/testing-2/webui
```

We pick the image URL and create the deployment:

```sh
 oc create dc bot --image=docker-registry.default.svc:5000/testing-2/webui
```

Finally we expose:

```sh
 oc expose dc/bot --port=8080 --target-port=8080
 oc expose svc bot
```

## More Info

For more info:

- [Keycloak caches configuration](https://www.keycloak.org/docs/3.0/server_installation/topics/cache.html)
- [Data replication & Failover](https://www.keycloak.org/docs/3.0/server_installation/topics/cache/replication.html) This basically say that Keycloak in Openshift elect only one pod to be the owner of the sessions. For more info on how to overcome this limitation see [Customizing RHSSO Container](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg).
