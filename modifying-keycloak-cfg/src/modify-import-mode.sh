#!/bin/sh

# copy fresh configuration file
curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/standalone-openshift.xml

# copy modified rhsso launcher
curl -o /opt/eap/standalone/bin/openshift-launch.sh https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/openshift-launch.sh

# execute launcher
#sh /opt/eap/standalone/bin/openshift-launch.sh

sleep 3600