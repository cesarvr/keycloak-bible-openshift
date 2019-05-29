
#Install gradle
curl -L https://services.gradle.org/distributions/gradle-5.4.1-bin.zip -o gradle.zip
unzip -d /var/tmp gradle.zip

## Add gradle to path
export PATH=$PATH:/var/tmp/gradle-5.4.1/bin/


## Building Module
echo "Building rhsso-spi-plugin"
curl -L https://github.com/aerogear/keycloak-metrics-spi/archive/master.zip -o master.zip
unzip master.zip

cd keycloak-metrics-spi-master/
./gradlew jar --stacktrace

## Serving 
echo "serving module"

cd build/libs/
python -m SimpleHTTPServer 8080
