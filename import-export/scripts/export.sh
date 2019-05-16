source /opt/eap/bin/launch/configure.sh
sh /opt/eap/bin/standalone.sh -Dkeycloak.migration.action=export \
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/migrate.json
