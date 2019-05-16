echo #####################
echo ## Starting Export ##
echo #####################

source /opt/eap/bin/launch/configure.sh
sh /opt/eap/bin/standalone.sh -c standalone-openshift.xml -bmanagement 127.0.0.1 -Dkeycloak.migration.action=export \
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/migrate.json
