const isEmpty = (value) => !value || value === ''

const getEnv = (envName) => {
  const env = process.env[envName]
  if (isEmpty(env)) {
    console.error(`Required environment variable ${envName} is not defined or empty`)
    console.error('Unable to proceed with service')
    process.exit(-2)
  }

  console.log(`[Environment Variable] ${envName} = ${env}`)
  return env
}

const STORAGE_URL = getEnv('STORAGE_API')
const STORAGEMQ_URL = getEnv('STORAGEMQ_API')
const AMQP_URL = getEnv('AMQP_URL')

module.exports = {
  STORAGE_URL,
  STORAGEMQ_URL,
  AMQP_URL
}
