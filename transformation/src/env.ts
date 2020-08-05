const getEnv = (envName: string): string => {
  const env = process.env[envName]
  if (env) {
    console.log(`[Evnironment Variable] ${envName} = ${env}`)
    return env
  } else {
    console.error(`Environment variable ${envName} is not defined, but is required`)
    console.error('Shutting down service')
    process.exit(-2)
  }
}

export const CONNECTION_RETRIES = +getEnv('CONNECTION_RETRIES')
export const CONNECTION_BACKOFF = +getEnv('CONNECTION_BACKOFF_IN_MS')
export const POSTGRES_HOST = getEnv('POSTGRES_HOST')
export const POSTGRES_PORT = +getEnv('POSTGRES_PORT')
export const POSTGRES_USER = getEnv('POSTGRES_USER')
export const POSTGRES_PW = getEnv('POSTGRES_PW')
export const POSTGRES_DB = getEnv('POSTGRES_DB')
export const POSTGRES_SCHEMA = getEnv('POSTGRES_SCHEMA')
export const AMQP_URL = getEnv('AMQP_URL')
export const AMQP_EXCHANGE = getEnv('AMQP_PIPELINE_EXECUTION_EXCHANGE')
export const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = getEnv('AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC')
export const AMQP_PIPELINE_EXECUTION_ERROR_TOPIC = getEnv('AMQP_PIPELINE_EXECUTION_ERROR_TOPIC')
export const AMQP_PIPELINE_CONFIG_CREATED_TOPIC = getEnv('AMQP_PIPELINE_CONFIG_CREATED_TOPIC')
export const AMQP_PIPELINE_CONFIG_UPDATED_TOPIC = getEnv('AMQP_PIPELINE_CONFIG_UPDATED_TOPIC')
export const AMQP_PIPELINE_CONFIG_DELETED_TOPIC = getEnv('AMQP_PIPELINE_CONFIG_DELETED_TOPIC')
