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
const SCHEDULER_URL = getEnv('SCHEDULER_API')
const ADAPTER_URL = getEnv('ADAPTER_API')
const TRANSFORMATION_URL = getEnv('TRANSFORMATION_API')
const NOTIFICATION_URL = getEnv('NOTIFICATION_API')
const MOCK_SERVER_URL = getEnv('MOCK_SERVER_API')
const MOCK_SERVER_WITHIN_DOCKER = getEnv('MOCK_SERVER_WITHIN_DOCKER_API')
const RABBIT_URL = getEnv('RABBIT_API')

module.exports = {
  STORAGE_URL,
  SCHEDULER_URL,
  ADAPTER_URL,
  TRANSFORMATION_URL,
  NOTIFICATION_URL,
  MOCK_SERVER_URL,
  MOCK_SERVER_WITHIN_DOCKER,
  RABBIT_URL
}
