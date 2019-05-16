source ${JBOSS_HOME}/bin/launch/configure.sh
sh ${JBOSS_HOME}/bin/standalone.sh -Dkeycloak.migration.action=export \
-Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/tmp/migrate.json
