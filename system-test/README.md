# Open-Data-Service System Tests
End-to-end tests that test the integrated components of the ods as a complete system.

## Usage
There are three ways of executing the system test:

### 1) Testing in the CI environment
* Just commit to the gitlab repository. System-tests are executed automatically.

### 2) Testing locally in the docker environment
* Build the latest version of the open-data-service via ```docker-compose build``` in the project root directory.
* Start the open-data-service via ```docker-compose up -d``` in the projects root directory (Startup can be speeded up by appending ```--scale ui=0```). 
* Run the system-test by ```docker-compose -f docker-compose.yml -f docker-compose.st.yml up system-test```. If you want your changes to be applied, you have to rebuild first. 
  
### 3) Testing locally outside of the docker environment
* Build and start the ods as outlined above.
* Start the mock-server by ```docker-compose -f docker-compose.yml -f docker-compose.st.yml up mock-server```.
* Install necessary dependencies by executing ```npm i``` in the system-test directory.
* Run the system test with your favourite IDE or by executing ```npm run test``` in the system-test directory.
