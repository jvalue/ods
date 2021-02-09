const { readEnvOrDie } = require('@jvalue/node-dry-basics')

const STORAGE_URL = readEnvOrDie('STORAGE_API')
const STORAGEMQ_URL = readEnvOrDie('STORAGEMQ_API')
const AMQP_URL = readEnvOrDie('AMQP_URL')

module.exports = {
  STORAGE_URL,
  STORAGEMQ_URL,
  AMQP_URL
}
