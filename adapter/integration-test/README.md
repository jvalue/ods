# Adapter Integration Tests


## Run

1. Build mock-server: `docker-compose -f ../../docker-compose.yml -f ../../docker-compose.yml build mock-server`
2. Run: `npm run test`. The test setup automatically starts the test


## Details

* A `mock-server` is spawned to mock an open data source.
* `setup.js` and `teardown.js` handle the docker initialization and teardown.
* `util/env.js` sets all required environment variables (hardcoded).