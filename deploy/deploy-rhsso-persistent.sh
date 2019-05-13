oc new-app --template=sso72-x509-postgresql-persistent \
           --param=SSO_ADMIN_USERNAME=admin \
           --param=SSO_ADMIN_PASSWORD=admin \
           --param=MEMORY_LIMIT=550Mi --param=VOLUME_CAPACITY=1Gi
