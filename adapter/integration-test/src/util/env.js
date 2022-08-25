const DOCKER_COMPOSE_FILES = ['../../docker-compose.yml', 'docker-compose.it.yml']
const DOCKER_ENV_FILE = '../../.env'
const ADAPTER_URL = 'http://localhost:9000/api/adapter'
const MOCK_SERVER_URL = 'http://localhost:9000/api/integration-tests/mock-server'
const MOCK_SERVER_URL_WITHIN_DOCKER = 'http://mock-server:8080'

const MOCK_SERVER_PORT = process.env.MOCK_SERVER_PORT || 8081
const AMQP_URL_OUTSIDE_DOCKER = 'amqp://rabbit_adm:R4bb!7_4DM_p4SS@localhost:5672'
const AMQP_URL = 'amqp://rabbit_adm:R4bb!7_4DM_p4SS@rabbitmq:5672'
const AMQP_EXCHANGE = 'ods_global'
const AMQP_CONNECTION_RETRIES = 40
const AMQP_CONNECTION_BACKOFF = 2000
const STARTUP_DELAY = 5000
const PUBLICATION_DELAY = 2000

module.exports = {
  DOCKER_COMPOSE_FILES,
  DOCKER_ENV_FILE,
  ADAPTER_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_PORT,
  MOCK_SERVER_URL_WITHIN_DOCKER,
  AMQP_URL_OUTSIDE_DOCKER,
  AMQP_URL,
  AMQP_EXCHANGE,
  AMQP_CONNECTION_RETRIES,
  AMQP_CONNECTION_BACKOFF,
  STARTUP_DELAY,
  PUBLICATION_DELAY
}
