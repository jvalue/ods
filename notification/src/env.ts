const isEmpty = (value: string | undefined): boolean => !value || value === ''

const getEnv = (envName: string): string => {
  const env = process.env[envName]
  if (isEmpty(env)) {
    console.error(`Required environment variable ${envName} is not defined or empty`)
    console.error('Unable to proceed with service')
    process.exit(-2)
  }

  console.log(`[Environment Variable] ${envName} = ${env}`)
  return env as string
}

export const CONNECTION_RETRIES = +getEnv('CONNECTION_RETRIES')
export const CONNECTION_BACKOFF = +getEnv('CONNECTION_BACKOFF_IN_MS')

export const POSTGRES_HOST = getEnv('PGHOST')
export const POSTGRES_PORT = +getEnv('PGPORT')
export const POSTGRES_USER = getEnv('PGUSER')
export const POSTGRES_PW = getEnv('PGPASSWORD')
export const POSTGRES_DB = getEnv('POSTGRES_DB')

export const AMQP_URL = getEnv('AMQP_URL')
export const AMQP_PIPELINE_EXECUTION_EXCHANGE = getEnv('AMQP_PIPELINE_EXECUTION_EXCHANGE')
export const AMQP_PIPELINE_EXECUTION_QUEUE = getEnv('AMQP_PIPELINE_EXECUTION_QUEUE')
export const AMQP_PIPELINE_EXECUTION_TOPIC = getEnv('AMQP_PIPELINE_EXECUTION_TOPIC')
export const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = getEnv('AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC')
