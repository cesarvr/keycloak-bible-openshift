## OAuth2

## Keycloak Setup

The best way to get started with Keycloak is to follow this getting [started guide](https://www.keycloak.org/docs/latest/getting_started/index.html#_install-boot), there you will learn how to setup Keycloak and create realms and client.

Once you finish you learn the basics you can come back to this guide to learn how to create a client capable of using Keycloak OpenID/OAuth2 to protect your services.


### Discovery

OAuth2 specify an auto-discovery URL, in Keycloak this URL are basically built in this form:

```xml
 https://{Server}:{Port}/auth/realms/<your-realm>/.well-known/openid-configuration
```
This URL will return a list of endpoints required to use OAuth2 authentication:

```js

{
  "issuer":"https://my-keycloak-server/auth/realms/demo-1",
  "authorization_endpoint":"https://my-keycloak-server/auth/realms/demo-1/protocol/openid-connect/auth",
  "token_endpoint":".../protocol/openid-connect/token",
  "token_introspection_endpoint":".../demo-1/protocol/openid-connect/token/introspect",
  "userinfo_endpoint":".../demo-1/protocol/openid-connect/userinfo",
  "end_session_endpoint":".../demo-1/protocol/openid-connect/logout"
  "etc..."
}
```


## Authentication Examples

This examples follow this [awesome OAuth2 guide](https://aaronparecki.com/oauth-2-simplified/).

- [Using WebUI](https://github.com/cesarvr/keycloak/tree/master/web-ui)
    - Sample service to perform simple authentication using OpenID OAuth2.

- [Testing Horizontal Scaling](https://github.com/cesarvr/keycloak-examples/tree/master/robot)
    - Just a simple service testing that the correct horizontal scaling of Keycloak instances.



## More Docs...

- Detailed implementation of OAuth2:
  - [OAuth2 Documentation](https://www.oauth.com/)
  - [OAuth2 RFC](https://tools.ietf.org/html/rfc6749)
  
- Keycloak:
  - [Keycloak Documentation](https://www.keycloak.org/docs/2.5/getting_started/index.html)
  
  
- Getting Started With OAuth2:
  - [Simple OAuth2 guide](https://aaronparecki.com/oauth-2-simplified/)
