const ADAPTER_URL = process.env.ADAPTER_URL || 'http://localhost:9000/api/adapter'
const SCHEDULER_URL = process.env.SCHEDULER_URL || 'http://localhost:9000/api/scheduler'
const STORAGE_MQ_URL = process.env.STORAGE_MQ_URL || 'http://localhost:9000/api/storage-mq'
const STORAGE_URL = process.env.STORAGE_URL || 'http://localhost:9000/api/storage'
const PIPELINE_URL = process.env.PIPELINE_URL || 'http://localhost:9000/api/pipelines'
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://localhost:9000/api/notification'
const AMQP_URL = process.env.AMQP_URL || 'amqp://rabbit_adm:R4bb!7_4DM_p4SS@localhost:5672'
const AMQP_EXCHANGE =  process.env.AMQP_EXCHANGE || 'ods_global'

const DOCKER_COMPOSE_FILE = process.env.DOCKER_COMPOSE_FILE || '../docker-compose.yml'
const ENV_FILE = process.env.ENV_FILE || './.env'

module.exports = {
  ADAPTER_URL,
  SCHEDULER_URL,
  STORAGE_MQ_URL,
  STORAGE_URL,
  PIPELINE_URL,
  NOTIFICATION_URL,
  AMQP_URL,
  AMQP_EXCHANGE,
  DOCKER_COMPOSE_FILE,
  ENV_FILE
}
