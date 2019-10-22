FROM jboss/keycloak

COPY ./ods-userservice-realm.json /tmp/realm.json
ENV KEYCLOAK_IMPORT /tmp/realm.json
