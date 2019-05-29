## Running Red Hat SSO In OpenShift

The best way to get started with Red Hat Single Sign On (RHSSO) is to follow this getting [started guide](https://www.keycloak.org/docs/latest/getting_started/index.html#_install-boot), there you will learn how to setup Keycloak and create realms, users and client.


## Red Hat Single Sign On  
 > In Openshift
 
This guide is about how to configure and running Red Hat Single Sign On specifically for Openshift.
 
  - ### Deployment Configuration
    - [Deployment](https://github.com/cesarvr/keycloak-examples/blob/master/horizontal-scaling/README.md#deployment)
    - [Discovery Process](https://github.com/cesarvr/keycloak-examples/blob/master/horizontal-scaling/README.md#discovery)
      - Strategies implemented by RHSSO to discover instances running in other nodes/pods.
    - [Distribute Cache](https://github.com/cesarvr/keycloak-examples/blob/master/horizontal-scaling/README.md#distributed-cache)
      - Underlaying technology to keep sessions. 
    - [Persistence](https://github.com/cesarvr/keycloak-examples/blob/master/horizontal-scaling/README.md#persistence)
      - Supported Database drivers by the container.
  - ### Export & Import
    - [Export](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#use_case)
      - [From Bare Metal](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#metal)
      - [From A Container Running In Openshift](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#export)
        - [Changing Init Configuration](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#changing)
        - [Restart Container](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#redeploy)
        - [Exporting Realms/Users To A File](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#export_file)
          - [Easy Export](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#automatic)
          - [Manual Export](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#manually)
        - [Streaming The Export File](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#streaming)
        - [Restoring Init Configuration](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#restoring-deployment)
    - [Import From A Container Running In Openshift](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#update)
      - [Deploy](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#deploy)
      - [Mounting File Into RHSSO Container](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#mounting)
      - [Running Container](https://github.com/cesarvr/keycloak-examples/tree/master/import-export#running)
  - ### Customizing Configuration 
     - [Use Case](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#use_case)
     - [How To Update The Configuration File](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#update)
     - [Implementation](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#impl)
        - [Downloading Files](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#down)
        - [Running Commands Inside The Container](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#container)
        - [Advantages](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#adv)
        - [Running](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#run)
     - [Complex Scenarios](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#complex)
     - [RHSSO Configuration File Observations](https://github.com/cesarvr/keycloak-examples/tree/master/modifying-keycloak-cfg#observe)
  - ### OAuth2 Integration
     - [Writing A OAuth2 Client](https://github.com/cesarvr/keycloak/tree/master/web-ui)
        - Step by Step OAuth2 client in Node.js.

------

## Tools
- [Testing Deployment](https://github.com/cesarvr/keycloak-examples/tree/master/robot)
   - Simple service to check for configuration errors in RHSSO/Keycloak deployments.

## Diving Deep

- Detailed implementation of OAuth2:
  - [OAuth2 Documentation](https://www.oauth.com/)
  - [OAuth2 RFC](https://tools.ietf.org/html/rfc6749)
    - [OAUth2 Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-12)
  

- Keycloak:
  - [Keycloak Documentation](https://www.keycloak.org/docs/2.5/getting_started/index.html)
  - [Security](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.2/html/server_administration_guide/threat_model_mitigation)


- Getting Started With OAuth2:
  - [Simple OAuth2 guide](https://aaronparecki.com/oauth-2-simplified/)


👍 Feel free to collaborate via pull request or opening an issue.
