
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



# First execution will fail
echo -e "\e[32m Building... \e[39m"

export GRADLE_OPTS="-Xmx64m -Dorg.gradle.jvmargs='-Xmx256m -XX:MaxPermSize=64m'"
./gradlew jar || true
 
## Serving 
echo "serving module"

cd build/libs/
python -m SimpleHTTPServer 8080
