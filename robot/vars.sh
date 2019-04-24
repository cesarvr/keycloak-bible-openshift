oc set env deploy robot-auth SSO=sso-testing.e4ff.pro-eu-west-1.openshiftapps.com
oc set env deploy robot-auth ROUTE=robot-auth-testing-2.e4ff.pro-eu-west-1.openshiftapps.com
oc set env deploy robot-auth REALM=demo-1
oc set env deploy robot-auth CLIENT_SECRET=


