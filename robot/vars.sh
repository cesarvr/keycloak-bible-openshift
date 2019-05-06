oc set env deploy robot-auth SSO=sso-keycloak.e4ff.pro-eu-west-1.openshiftapps.com
oc set env deploy robot-auth ROUTE=robot-auth-keycloak.e4ff.pro-eu-west-1.openshiftapps.com
oc set env deploy robot-auth REALM=demo-1
oc set env deploy robot-auth CLIENT_SECRET=ebe57101-c865-4c17-b489-557fa71bca52
