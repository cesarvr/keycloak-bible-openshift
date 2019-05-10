## Horizontal Scale of Keycloak/Red Hat SSO in Openshift

### Pod Scaling

Openshift takes care not only of keeping application alive but it also make sure to distribute the pods across [nodes](https://docs.openshift.com/enterprise/3.0/architecture/infrastructure_components/kubernetes_infrastructure.html#node), this is not different for RHSSO.

![high level view](https://github.com/cesarvr/keycloak-examples/blob/master/docs/scaling-pod-up.png?raw=true)

> Here we see an Openshift configuration with 3 pods evenly distributed across nodes.

Once RHSSO containers are up and running and has pass the [liveness probe check](), they get automatically subscribed to the [Openshift service](https://docs.openshift.com/enterprise/3.0/architecture/core_concepts/pods_and_services.html#services) load balancer table which start directing traffic to them.

![traffic from service](https://github.com/cesarvr/keycloak-examples/blob/master/docs/service-dns.png?raw=true)

> The load balancing is handled by the Openshift service abstraction.  

### Discovery

Then RHSSO use a discovery algorithm to locate nearby RRHSSO instance members (pods) by using the [JGroups DNS_PING protocol](http://www.jgroups.org/manual4/index.html#_dns_ping), this algorithm basically works by fetching a list of active pods from the Openshift service.

Once the RHSSO discover surrounding instances then it perform the [synchronization of sessions, caches. etc.](https://www.keycloak.org/docs/3.0/server_installation/topics/cache.html) using JGroups/Inifinispan API's for pod intra-communication.

### Distributed Cache

![sessions](https://github.com/cesarvr/keycloak-examples/blob/master/docs/sessions.png?raw=true)

RHSSO implement the concept of cache owners, it basically elect a pod or pods as the gatekeepers for the state of the session, if this owner crash then users in the system will need to re-authenticate.

By default session owners in Openshift is configure for only 1 owner which in some cases is not enough, if you want to increase this number just [read the Customizing RHSSO Container guide.](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#customizing-rhsso-container)


### Persistence

![](https://github.com/cesarvr/keycloak-examples/blob/master/docs/persistence.png?raw=true)

In addition to sessions RHSSO use another layer of storage for persistent data store entities such as Realms and Users. This layer is managed by the [Wildfly DataSource Subsystem](https://docs.jboss.org/author/display/WFLY10/DataSource+configuration).

The RHSSO image comes with support out-of-the-box for the following drivers:
 - [MySQL](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.2/html/server_installation_and_configuration_guide/database-1#database_configuration)
 - [PostgreSQL](https://www.postgresql.org/)
 - [MONGO_DB](https://www.mongodb.com/) (Driver is present, but not documented).


## More Info

For more info:

- [Testing RHSSO Deployment In Openshift](https://github.com/cesarvr/keycloak-examples/tree/master/robot)

- [Keycloak caches configuration](https://www.keycloak.org/docs/3.0/server_installation/topics/cache.html)
- [Data replication & Failover](https://www.keycloak.org/docs/3.0/server_installation/topics/cache/replication.html) This basically say that Keycloak in Openshift elect only one pod to be the owner of the sessions. For more info on how to overcome this limitation see [Customizing RHSSO Container](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg).
