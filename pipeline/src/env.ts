const isEmpty = (value: string | undefined): value is undefined => !value || value === ''

const getEnv = (envName: string): string => {
  const env = process.env[envName]
  if (isEmpty(env)) {
    console.error(`Required environment variable ${envName} is not defined or empty`)
    console.error('Unable to proceed with service')
    process.exit(-2)
  }

  console.log(`[Environment Variable] ${envName} = ${env}`)
  return env
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
export const AMQP_DATASOURCE_EXECUTION_EXCHANGE = getEnv('AMQP_DATASOURCE_EXECUTION_EXCHANGE')
export const AMQP_DATASOURCE_EXECUTION_TOPIC = getEnv('AMQP_DATASOURCE_EXECUTION_TOPIC')
export const AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC = getEnv('AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC')
export const AMQP_PIPELINE_EXECUTION_QUEUE = getEnv('AMQP_PIPELINE_EXECUTION_QUEUE')
