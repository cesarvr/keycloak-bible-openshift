## Running Red Hat SSO In OpenShift

The best way to get started with Red Hat Single Sign On (RHSSO) is to follow this getting [started guide](https://www.keycloak.org/docs/latest/getting_started/index.html#_install-boot), there you will learn how to setup Keycloak and create realms, users and client.

This guide is about how to configure and run RHSSO with OpenShift.


### Guides

- [How To Create An OAuth2 Client](https://github.com/cesarvr/keycloak/tree/master/web-ui)
    - Writing a simple OAuth2 client from scratch, in Node.js.

- [Deployment Documentation For Red Hat Single Sign On](https://github.com/cesarvr/keycloak-examples/tree/master/horizontal-scaling)

- [Importing/Export](https://github.com/cesarvr/keycloak-examples/tree/master/import-export)
    - How to Import/Export RHSSO/Keycloak users in OpenShift.

- [Modifying Configuration Files](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg)
    - An elegant way to change configuration files before the container starts.


### Tools
- [Testing Deployment](https://github.com/cesarvr/keycloak-examples/tree/master/robot)
   - How to use a simple service to check that RHSSO/Keycloak deployment.

## Diving Deep

- Detailed implementation of OAuth2:
  - [OAuth2 Documentation](https://www.oauth.com/)
  - [OAuth2 RFC](https://tools.ietf.org/html/rfc6749)

- Keycloak:
  - [Keycloak Documentation](https://www.keycloak.org/docs/2.5/getting_started/index.html)


- Getting Started With OAuth2:
  - [Simple OAuth2 guide](https://aaronparecki.com/oauth-2-simplified/)


👍 Feel free to collaborate via pull request or opening an issue.
