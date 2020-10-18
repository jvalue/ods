const isEmpty = (value: string | undefined): value is undefined => value === undefined || value === ''

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

export const MAX_TRIGGER_RETRIES = +getEnv('MAX_TRIGGER_RETRIES')
export const CONNECTION_RETRIES = +getEnv('CONNECTION_RETRIES')
export const CONNECTION_BACKOFF_IN_MS = +getEnv('CONNECTION_BACKOFF_IN_MS')
export const ADAPTER_SERVICE_URL = getEnv('ADAPTER_SERVICE_URL')
export const AMQP_URL = getEnv('AMQP_URL')
export const AMQP_SCHEDULER_EXCHANGE = getEnv('AMQP_EXCHANGE')
export const AMQP_SCHEDULER_QUEUE = getEnv('AMQP_SCHEDULER_QUEUE')
export const AMQP_DATASOURCE_CONFIG_TOPIC = getEnv('AMQP_DATASOURCE_CONFIG_TOPIC')
export const AMQP_DATASOURCE_CONFIG_CREATED_TOPIC = getEnv('AMQP_DATASOURCE_CONFIG_CREATED_TOPIC')
export const AMQP_DATASOURCE_CONFIG_DELETED_TOPIC = getEnv('AMQP_DATASOURCE_CONFIG_DELETED_TOPIC')
export const AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC = getEnv('AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC')
