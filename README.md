## OAuth2 


### Discovery

OAuth2 specify an auto-discovery URL, in Keycloak this URL are basically built in this form:

```
    https://{Server}:{Port}/auth/realms/<your-realm>/.well-known/openid-configuration
```
This URL will return a list of endpoints that you need to perform various types of authentication:

```json

{
  "issuer":"https://my-keycloak-server/auth/realms/demo-1",
  "authorization_endpoint":"https://my-keycloak-server/auth/realms/demo-1/protocol/openid-connect/auth",
  "token_endpoint":"https://my-keycloak-server/auth/realms/demo-1/protocol/openid-connect/token",
  "token_introspection_endpoint":"https://my-keycloak-server/auth/realms/demo-1/protocol/openid-connect/token/introspect",
  "userinfo_endpoint":"https://my-keycloak-server/auth/realms/demo-1/protocol/openid-connect/userinfo",
  "end_session_endpoint":"https://my-keycloak-server/auth/realms/demo-1/protocol/openid-connect/logout"
  "etc..."
}
```


## Authentication Types

- [Using WebUI](https://github.com/cesarvr/keycloak/tree/master/web-ui)
    - The user authenticate against an authentication agent (like Keycloak). 
