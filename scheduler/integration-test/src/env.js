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

const SCHEDULER_URL = getEnv('SCHEDULER_API')
const AMQP_URL = getEnv('AMQP_URL')
const AMQP_CONNECTION_RETRIES = +getEnv('AMQP_CONNECTION_RETRIES')
const AMQP_CONNECTION_BACKOFF = +getEnv('AMQP_CONNECTION_BACKOFF')
const MOCK_SERVER_PORT = +getEnv('MOCK_SERVER_PORT')
const MOCK_SERVER_URL = getEnv('MOCK_SERVER_API')

module.exports = {
  SCHEDULER_URL,
  AMQP_URL,
  AMQP_CONNECTION_RETRIES,
  AMQP_CONNECTION_BACKOFF,
  MOCK_SERVER_PORT,
  MOCK_SERVER_URL
}
