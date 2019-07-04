# Scheduler-Service for ODS

## Getting Started

### Running the application

There are two ways to start the NodeJs server:

- the preferred way is running `docker-compose docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up adapter-service up scheduler-service`
- if you don't want to use docker-compose you can also run `npm start` in the project root directory. Make sure all dependencies are downloaded by running `npm install` beforehand.

The server should now be running on http://localhost:8080

### Testing

Run the unit tests with `npm test`. Jest is used as unit testing framework.

For integration testing run `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up scheduler-service scheduler-service-it`.

### Build docker container manually

Run `docker build .` in the root of this project in order to build the docker image manually.