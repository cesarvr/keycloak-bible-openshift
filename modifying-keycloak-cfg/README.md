## Keycloak Horizontal Scaling

In OpenShift Keycloak by default support horizontal scaling allowing pods to keep a session. But there is a small hicup and this is that Keycloak out-of-the-box only support one *owner* of the data, meaning that other pods in the cluster will select rely the [sessions state](https://www.keycloak.org/docs/2.5/server_installation/topics/cache/replication.html). 

We can easily configure this by just editing the ``standalone-openshift.xml`` file like the Documentation suggest but the problem is that we are dealing with containers and we need to look for another way to insert this configuration. 


My approach for this is to create a mantainable configuration file that will live in some secure place (like a git repository, internal FTP, static file) and then modify the pod initialization routine to update the configuration with a copy of this file before starting the container, let's see how we do that. 


Let's assume we are going to use this site ...



