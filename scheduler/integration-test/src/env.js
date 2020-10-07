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

module.exports = {
  SCHEDULER_URL,
  AMQP_URL
}
