# Scheduler-Service for ODS

## Getting Started

### Running the application

Since the scheduler performs an initial sync with the adapter service, it is currently only available to start in in the docker environment:
Run `docker-compose -f ../docker-compose.yml up scheduler adapter`. 

### Testing

Run the unit tests with `npm test`. Jest is used as unit testing framework.

* For integration testing run `docker-compose -f ../docker-compose.yml -f ../docker-compose.it.yml --env-file ../.env up scheduler scheduler-it`.
  
* After running integration tests dependant services (e.g. rabbit-mq) keep running. In order to stop all services and return to a clean, initial state run `docker-compose -f ../docker-compose.yml -f ../docker-compose.it.yml down`. 

* To run integration tests outside of the docker environment run the `it_local.sh` script.

### Build docker container manually

Run `docker build .` in the root of this project in order to build the docker image manually.
