## OAuth2 

## Keycloak Setup 

The best way to get started with Keycloak is to follow this getting [started guide](https://www.keycloak.org/docs/latest/getting_started/index.html#_install-boot), there you will learn how to setup Keycloak and create realms and client. 

Once you finish you learn the basics you can come back to this guide to learn how to create a client capable of using Keycloak OpenID/OAuth2 to protect your services.


### Discovery

OAuth2 specify an auto-discovery URL, in Keycloak this URL are basically built in this form:

```xml
 https://{Server}:{Port}/auth/realms/<your-realm>/.well-known/openid-configuration
```
This URL will return a list of endpoints that you need to perform various types of authentication:

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
    - The user authenticate against an authentication agent (like Keycloak). 
    
    
    
    
    
