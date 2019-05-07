## Horizontal Scalle Keycloak/Red Hat SSO  

RHSSO perform a discovery of new pods using the [DNS_PING protocol](http://www.jgroups.org/manual4/index.html#_dns_ping) which use OpenShift Service to retrive the pods when they become active, meaning that they have pass the [liveness test](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/). 

Once the RHSSO discover surrounding instances then it perform a [synchronization of sessions](https://www.keycloak.org/docs/3.0/server_installation/topics/cache.html). 

For more info: 

- [Keycloak caches configuration](https://www.keycloak.org/docs/3.0/server_installation/topics/cache.html)
- [Data replication & Failover](https://www.keycloak.org/docs/3.0/server_installation/topics/cache/replication.html) This basically says, that Keycloak elect an pod to be the owner of the sessions if this pod owning the data crash, then users need to logging again.

## Testing Horizontal Scaling

To test any miss configuration I develop this basic OAuth2 client which requires to authenticate a client and then perform an automatic token refresh every 1 second against all the pods.  

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/unsync.gif?raw=true)


> In this example obtain the token and then scale our deployment to 3 pods, then we can see that we are having problems getting our token validated because the new RHSSO instances are not in sync.


### Install

```sh
 npm install
 node index.js --cloud # To deploy
```

### Remove

To remove the service from the cluster once you finish you just need to run:

```sh
node index --remove
```


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

To remove the server from the cluster: 

```sh
docker run -it deploy-me node index.js --remove
```


## Environment Variables

Once this service is deployed it will require this environment variables to work:

- ``SSO`` URL to Keycloak instance.
- ``ROUTE`` The URL of this service once deployed.
- ``CLIENT_SECRET`` The [secret id](https://www.keycloak.org/docs/2.5/server_admin/topics/clients/oidc/confidential.html) between Keycloak and client.
- ``REALM`` A Keycloak realm.

You can use ``oc set env`` for this example:

```sh
  oc set env deploy web-test SSO=my-keycloak.domain
```

## Alternative Way Of Deployment


### Manual Configuration 

In some Linux distributions the TTY is not compatible with OKD-runner, but you can still use the self-deploy capability by writing the configuration file yourself: 

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

Save this file in the same folder as this project and then execute self-deploy mechanism: 

```sh
  node index.js --cloud
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

## The Hard Way (Using OC) 

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



