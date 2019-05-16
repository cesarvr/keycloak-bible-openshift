echo #####################
echo ## Starting Export ##
echo #####################

## Fetch configuation file
curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml

## Modify configuation file using RHSSO container values
source /opt/eap/bin/launch/openshift-common.sh
source /opt/eap/bin/launch/logging.sh
source /opt/eap/bin/launch/configure.sh

## Start RHSSO import mode
sh /opt/eap/bin/standalone.sh -c standalone-openshift.xml -bmanagement 127.0.0.1 -Dkeycloak.migration.action=export \
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/migrate.json | grep -i export
