main () {
 # Copy fresh configuration file
 curl -o /opt/eap/standalone/configuration/standalone-openshift.xml https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/standalone-openshift.xml

 # Copy modified rhsso launcher
 curl -o /opt/eap/bin/openshift-launch.sh https://raw.githubusercontent.com/cesarvr/keycloak-examples/master/modifying-keycloak-cfg/src/openshift-launch.sh


 # Install prometheus metrics exporter 
 #
 # https://github.com/aerogear/keycloak-metrics-spi
 #
 mkdir -p /opt/eap/providers
 curl http://metrics-builder/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar -o /opt/eap/providers/keycloak-metrics-spi-1.0.2-SNAPSHOT.jar
 

 # Execute launcher
 sh /opt/eap/bin/openshift-launch.sh
}

main 
