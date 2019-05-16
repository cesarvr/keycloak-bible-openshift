echo #####################
echo ## Starting Export ##
echo #####################

source /opt/eap/bin/launch/configure.sh

curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/standalone-openshift.xml

sh /opt/eap/bin/standalone.sh -c standalone-openshift.xml -bmanagement 127.0.0.1 -Dkeycloak.migration.action=export \
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/migrate.json
