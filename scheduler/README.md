# Scheduler-Service for ODS

## Getting Started

### Running the application

Since the scheduler performs an initial sync with the adapter service, it is currently only available to start in in the docker environment:
Run `docker-compose -f ../docker-compose.yml up scheduler adapter`. 

### Testing

Run the unit tests with `npm test`. Jest is used as unit testing framework.

For integration testing run `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up scheduler-service scheduler-service-it`.
To run integration tests outside of the docker environment run the `it_local.sh` script.

### Build docker container manually

Run `docker build .` in the root of this project in order to build the docker image manually.
