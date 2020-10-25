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

export const CONNECTION_RETRIES = +getEnv('CONNECTION_RETRIES')
export const CONNECTION_BACKOFF = +getEnv('CONNECTION_BACKOFF_IN_MS')
export const PIPELINE_API = getEnv('PIPELINE_API')
export const ADAPTER_API = getEnv('ADAPTER_API')
export const AMQP_URL = getEnv('AMQP_URL')
export const AMQP_EXCHANGE = getEnv('AMQP_EXCHANGE')
export const AMQP_PIPELINE_TRIGGER_QUEUE = getEnv('AMQP_PIPELINE_TRIGGER_QUEUE')
export const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = getEnv('AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC')
