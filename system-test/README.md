# Open-Data-Service System Tests
End-to-end tests complete system using the services public API.
The system tests are organized in different scenarios which run after each other.

## Run system tests local

To run the system tests local you should use the Docker setup that is also used in the CI.

Step 1:
In one terminal window you should start all services that are required for the ODS to run. 

```
docker-compose -f docker-compose.yml -f docker-compose.st.yml up  adapter pipeline storage storage-mq notification scheduler edge mock-server
```

Step 2:
In a second terminal window you can now create a clean build and than run the system tests as Docker container.

```
docker-compose -f docker-compose.yml -f docker-compose.st.yml build --no-cache system-test && docker-compose -f docker-compose.yml -f docker-compose.st.yml up system-test
```

If you face any problems during test development because of persisted data you can remove the persistence layer of the database containers. 
This will result in a clean databases and therefore a clean start of the ODS.

```
docker rm -f open-data-service_notification-db_1 open-data-service_pipeline-db_1 open-data-service_adapter-db_1 open-data-service_storage-db_1
```
