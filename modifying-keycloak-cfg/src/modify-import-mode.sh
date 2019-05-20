main () {
 # copy fresh configuration file
 curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/standalone-openshift.xml

 # copy modified rhsso launcher
 curl -o /opt/eap/bin/openshift-launch.sh https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/openshift-launch.sh

 # execute launcher
 FILE=/opt/eap/bin/openshift-launch.sh
 if test -f "$FILE"; then
    echo "$FILE exist"

    sh $FILE
 fi
}

main 
