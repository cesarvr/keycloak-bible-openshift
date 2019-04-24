## Testing Keycloak Horizontal Scale

This authenticate an user against Keycloak obtaining a token (by login in) and use it to ping the Keycloak deployment (OpenShift Service), testing all available pods acknowledge the token.


## Install

```sh
 npm install
 node index.js --cloud # To deploy
```

Once this service is deployed it will require this environment variables to work:

- ``SSO`` URL to Keycloak instance.
- ``ROUTE`` The URL of this service once deployed.
- ``CLIENT_SECRET`` The [secret id](https://www.keycloak.org/docs/2.5/server_admin/topics/clients/oidc/confidential.html) between Keycloak and client.
- ``REALM`` A Keycloak realm.

You can use ``oc set env`` for this example:

```sh
  oc set env deploy web-test SSO=my-keycloak.domain
```


## Running

Once we finish this setup we can execute this program and login to the realm using some credentials.



## Cleaning

To remove the service from the cluster once you finish you just need to run:

```sh
node index --remove
```
