## Installing Keycloak

If you are using Minishift or any other solution to run Openshift locally, you might find that it doesn't include Keycloak image in the software catalog, that's why I made this small guide to install Open Source Keycloak in OpenShift, of course, is not ready for production but it helps to run some tests locally. 


### Installing Keycloak image 


Assuming we got our local [OpenShift up and running and we have created a project](https://github.com/cesarvr/Openshift), then we need to import an image into our project using the [oc-client](https://github.com/cesarvr/Openshift#before-we-start): 

```sh
oc import-image keycloak:latest \
  --from=docker.io/jboss/keycloak --confirm
```  

The ``oc import-image`` basically grabs an image from an external container image repository like [Docker.io](https://hub.docker.com/r/jboss/keycloak/) and it creates a kind of accessible "shortcut" managed by a [ImageStream](https://docs.openshift.com/enterprise/3.0/architecture/core_concepts/builds_and_image_streams.html). Put it simply, now you can deploy this image in your local OpenShift.

 - You can check the image by doing: 

    ```sh
        oc get is

#NAME                   DOCKER REPO                                  TAGS      UPDATED
#keycloak               172.30.1.1:5000/hello/keycloak
    ```


Now we can deploy our image by creating a simple [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/):

```sh
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak 
  labels:
    app: kc
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kc
  template:
    metadata:
      labels:
        app: kc
    spec:
      containers:
      - name: keycloak
        image: 172.30.1.1:5000/hello/keycloak
        command: ['sh', '-c', '/opt/jboss/keycloak/bin/standalone.sh']
        env:
        - name: KEYCLOAK_USER
          value: admin 
        - name: KEYCLOAK_PASSWORD
          value: admin 
        ports:
        - containerPort: 8080
```

Save this into ``keycloak.yml`` and you can use this command to execute this: 

```sh
    oc create -f keycloak.yml
```




