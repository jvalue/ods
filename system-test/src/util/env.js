const DOCKER_COMPOSE_FILES = ['../docker-compose.yml', '../docker-compose.st.yml']
const DOCKER_ENV_FILE = '../.env'
const STORAGE_URL = 'http://localhost:9000/api/storage'
const STORAGE_MQ_URL = 'http://localhost:9000/api/storage-mq'
const SCHEDULER_URL = 'http://localhost:9000/api/scheduler'
const ADAPTER_URL = 'http://localhost:9000/api/adapter'
const PIPELINE_URL = 'http://localhost:9000/api/pipelines'
const NOTIFICATION_URL = 'http://localhost:9000/api/notification'
const MOCK_SERVER_URL = 'http://localhost:9000/api/system-tests/mock-server'
const MOCK_SERVER_WITHIN_DOCKER = 'http://mock-server:8080'

const ALL_SERVICES = [
  'adapter',
  'adapter-db',
  'adapter-outboxer',
  'edge',
  'notification',
  'notification-db',
  'pipeline',
  'pipeline-db',
  'pipeline-outboxer',
  'scheduler',
  'storage',
  'storage-db',
  // 'storage-db-liquibase', //Only creates the database schema and then exits, therefore ignore
  'storage-mq'
].sort()

module.exports = {
  ALL_SERVICES,
  DOCKER_COMPOSE_FILES,
  DOCKER_ENV_FILE,
  STORAGE_URL,
  STORAGE_MQ_URL,
  SCHEDULER_URL,
  ADAPTER_URL,
  PIPELINE_URL,
  NOTIFICATION_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_WITHIN_DOCKER
}
