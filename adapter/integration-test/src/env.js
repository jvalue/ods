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

const STARTUP_DELAY = +getEnv('STARTUP_DELAY')
const PUBLICATION_DELAY = +getEnv('PUBLICATION_DELAY')

const envLog = `
[Environment Variable] ADAPTER_URL = ${ADAPTER_URL}
[Environment Variable] MOCK_SERVER_URL = ${MOCK_SERVER_URL}
[Environment Variable] MOCK_SERVER_PORT = ${MOCK_SERVER_PORT}
[Environment Variable] RABBIT_HEALTH = ${RABBIT_HEALTH}
[Environment Variable] AMQP_URL = ${AMQP_URL}
[Environment Variable] STARTUP_DELAY = ${STARTUP_DELAY}
[Environment Variable] PUBLICATION_DELAY = ${PUBLICATION_DELAY}
`
console.log(envLog)

module.exports = {
  ADAPTER_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_PORT,
  RABBIT_HEALTH,
  AMQP_URL,
  STARTUP_DELAY,
  PUBLICATION_DELAY
}
