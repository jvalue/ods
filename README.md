# ODS-Main

Main project for ODS. All related microservice projects for ODS are located in sub-directories.


## Run

Use `docker-compose up` to run all microservices in production mode.

Use `docker-compose -f docker-compose.yml -f docker-compose.ci.yml up <services>` for starting up specific services in development mode and intergation tests. See sub-directories for futher information.