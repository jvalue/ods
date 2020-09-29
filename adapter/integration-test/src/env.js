const isEmpty = (value) => !value || value === ''

const getEnv = (envName) => {
  const env = process.env[envName]
  if (isEmpty(env)) {
    console.error(`Required environment variable ${envName} is not defined or empty`)
    console.error('Unable to proceed with service')
    process.exit(-2)
  }

  return env
}

const ADAPTER_URL = getEnv('ADAPTER_API')
const MOCK_SERVER_URL = getEnv('MOCK_SERVER_API')
const MOCK_SERVER_PORT = getEnv('MOCK_SERVER_PORT')

// AMQP VARS
const RABBIT_HEALTH = getEnv('RABBIT_HEALTH')
const AMQP_URL = getEnv('AMQP_URL')
const AMQP_EXCHANGE = getEnv('AMQP_EXCHANGE')
const AMQP_IT_QUEUE = getEnv('AMQP_IT_QUEUE')
const EXECUTION_TOPIC = getEnv('AMQP_EXECUTION_TOPIC')
const EXECUTION_SUCCESS_TOPIC = getEnv('AMQP_EXECUTION_SUCCESS_TOPIC')
const EXECUTION_FAILED_TOPIC = getEnv('AMQP_EXECUTION_FAILED_TOPIC')

const STARTUP_DELAY = +getEnv('STARTUP_DELAY')

module.exports = {
  ADAPTER_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_PORT,
  RABBIT_HEALTH,
  AMQP_URL,
  AMQP_EXCHANGE,
  AMQP_IT_QUEUE,
  EXECUTION_TOPIC,
  EXECUTION_SUCCESS_TOPIC,
  EXECUTION_FAILED_TOPIC,
  STARTUP_DELAY
}
