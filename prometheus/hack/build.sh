

echo -e "\e[32m Installing Gradle... \e[39m"
#Install gradle
curl -L https://services.gradle.org/distributions/gradle-5.4.1-bin.zip -o gradle.zip
unzip -o -d /var/tmp gradle.zip

## Add gradle to path
export PATH=$PATH:/var/tmp/gradle-5.4.1/bin/


## Building Module
echo -e "\e[32m Compiling rhsso-spi-plugin... \e[39m"
curl -L https://github.com/aerogear/keycloak-metrics-spi/archive/master.zip -o master.zip
unzip -o -d $HOME/ master.zip

cd $HOME/keycloak-metrics-spi-master/



# First execution will fail
echo -e "\e[32m Building... \e[39m"


cd keycloak-metrics-spi-master/
export GRADLE_OPTS="-Xmx64m -Dorg.gradle.jvmargs='-Xmx64m -XX:MaxPermSize=64m'"
./gradlew jar -q && cd build/libs/ && python -m SimpleHTTPServer 8080
