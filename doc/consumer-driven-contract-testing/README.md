# Open-Data-Service Consumer-Driven Contract Testing (CDCT)

## Brief introduction to Consumer-Driven Contract Testing

### Consumer-Driven Contracts

When a service consumes the API provided by another service, the consuming service (**Consumer**) has expectations regarding the communication. For example, the consumer expects that the providing service (**Provider**) is able to process its request and send a response that contains the expected data and that the Consumer can interpret properly. Such expectations of a Consumer form a **Consumer-Driven Contract**.

### Consumer-Driven Contract Testing

**Consumer-Driven Contract Testing** (**CDCT**) tests integrations between services. The goal is to ensure that the tested services are compatible, meaning that they are able to communicate and have a common understanding of the requests and responses or messages they send to each other.

In the ODS project, the open source tool **Pact** is used for implementing the Consumer-Driven Contract Tests. It supports the testing of both HTTP- and message-based interactions between Consumers and Providers.

If you have never worked with Pact before, please read the explanation of how Pact works in the Pact Docs: [How Pact works](https://docs.pact.io/getting_started/how_pact_works)

## Running Consumer-Driven Contract Tests locally

The Consumer-Driven Contract Tests of all services are automatically run in the CI. However, if you want to execute the tests locally, make sure that `docker` and `docker-compose` is installed on your computer. In the `src` directories of those services, that have implemented CDCT, there are bash scripts that can execute those tests. The script files have the following naming convention:

- `cdct-consumer.sh` for **Consumer testing**
- `cdct-provider.sh` for **Provider verification**

In order to test an integration between a Consumer and a Provider, make sure to run the Consumer testing first, because this generates the **contract files** that are required during Provider verification. The contract files will be stored in a folder called `pacts`. That folder will also contain a `logs` folder, where the log files during Consumer testing and Provider verification will be written to.

If you want to run the tests without `docker` and `docker-compose`, you may try to run the desired `npm` script (`test:consumer` for Consumer testing and `test:provider` for Provider verification) that is defined in the `package.json` file of the corresponding service. It should succeed in cases where other dependent services and/or database systems are not required for proper test execution. However, there are a few Consumer-Driven Contract Tests that require a more complex testing setup with such dependencies. In those cases, running the corresponding `npm` script will eventually fail during the test execution when the dependent systems are not available or incorrectly configured.

## Where to find Consumer-Driven Contract Tests in the ODS project

The files containing the source code of the Consumer-Driven Contract Tests are found in the `src` directories of those services, that have implemented CDCT. Regarding services implemented in TypeScript, the test files all share a common naming convention:

- `*.consumer.pact.test.ts` for **Consumer testing**, where `*` is the name of the corresponding Provider
- `*.provider.pact.test.ts` for **Provider verification**, where `*` is the name of the corresponding Consumer

## Writing Consumer-Driven Contract Tests

If you want to modify existing Consumer-Driven Contract Tests or especially for creating new ones, you should take a deep look into the [Pact Docs](https://docs.pact.io/) as they provide useful information and many good practices to follow. Also, the [Pact JS workshop](https://github.com/pact-foundation/pact-workshop-js) is recommended to step through a practical example.

### For Consumer testing

For creating a test for Consumer testing, create a new file in the `src` directory that follows the naming convention for test files above. Take a look at [jest-pact](https://www.npmjs.com/package/jest-pact) on how to get the required boilerplate code right. On that page, it is also stated that you should create a separate `*.consumer.pact.fixtures.ts` file, that contains the requests and responses used in the actual test file.

If there is an existing test file for Consumer testing that you want to extend, add the boilerplate code for a new interaction (see [jest-pact](https://www.npmjs.com/package/jest-pact)). In order to write the test for an interaction, follow the recommendations in the Pact Docs. You should use existing requests and responses from the fixtures file or add new ones if necessary.

### For Provider verification

To create a test for Provider verification, also create a new file in the `src` directory that follows the naming convention for test files above. Regarding Provider verification, there is no need to use `jest-pact`. You can simply write the test as it is recommended in the Pact Docs.

If you need to modify an existing test for Provider verification, you probably only want to change how mocking within the Provider is done or add/modify/remove a state handler that configures the state of the Provider during test execution.
