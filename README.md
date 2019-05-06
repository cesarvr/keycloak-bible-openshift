## Keycloak Setup

The best way to get started with Red Hat Single Sign On (RHSSO) is to follow this getting [started guide](https://www.keycloak.org/docs/latest/getting_started/index.html#_install-boot), there you will learn how to setup Keycloak and create realms, users and client.

This guide is about how to configure and run RHSSO with OpenShift.


### Guides

- [How To Create An OAuth2 Client](https://github.com/cesarvr/keycloak/tree/master/web-ui)
    - Writing a simple OAuth2 client from scratch, in Node.js. 

- [Testing Horizontal Scaling](https://github.com/cesarvr/keycloak-examples/tree/master/robot)
    - How to use a simple service to check that RHSSO/Keycloak instances are running in domain mode and they share a user session.

- [Importing/Export](https://github.com/cesarvr/keycloak-examples/tree/master/import-export)
    - How to Import/Export RHSSO/Keycloak users in OpenShift. 
  
  
## Diving Deep

- Detailed implementation of OAuth2:
  - [OAuth2 Documentation](https://www.oauth.com/)
  - [OAuth2 RFC](https://tools.ietf.org/html/rfc6749)

- Keycloak:
  - [Keycloak Documentation](https://www.keycloak.org/docs/2.5/getting_started/index.html)
  
  
- Getting Started With OAuth2:
  - [Simple OAuth2 guide](https://aaronparecki.com/oauth-2-simplified/)
