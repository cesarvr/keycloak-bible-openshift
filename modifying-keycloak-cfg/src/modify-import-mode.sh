main () {
 # copy fresh configuration file
 curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/standalone-openshift.xml

 # copy modified rhsso launcher
 curl -o /opt/eap/bin/openshift-launch.sh https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/openshift-launch.sh


 # installing prometheus metrics exporter 
 #
 # https://github.com/aerogear/keycloak-metrics-spi
 #
 mkdir -p /opt/eap/providers
 curl http://metrics-keycloak.e4ff.pro-eu-west-1.openshiftapps.com/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar -o /opt/eap/providers/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar
 

 # execute launcher
 sh /opt/eap/bin/openshift-launch.sh
}

main 
