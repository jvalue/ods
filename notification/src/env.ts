import { readEnvOrDie } from '@jvalue/node-dry-basics'

export const CONNECTION_RETRIES = +readEnvOrDie('CONNECTION_RETRIES')
export const CONNECTION_BACKOFF = +readEnvOrDie('CONNECTION_BACKOFF_IN_MS')

export const POSTGRES_HOST = readEnvOrDie('POSTGRES_HOST')
export const POSTGRES_PORT = +readEnvOrDie('POSTGRES_PORT')
export const POSTGRES_USER = readEnvOrDie('POSTGRES_USER')
export const POSTGRES_PW = readEnvOrDie('POSTGRES_PW')
export const POSTGRES_DB = readEnvOrDie('POSTGRES_DB')
export const POSTGRES_SSL = readEnvOrDie('POSTGRES_SSL').toLowerCase() === 'true'

export const AMQP_URL = readEnvOrDie('AMQP_URL')
export const AMQP_PIPELINE_EXECUTION_EXCHANGE = readEnvOrDie('AMQP_PIPELINE_EXECUTION_EXCHANGE')
export const AMQP_PIPELINE_EXECUTION_QUEUE = readEnvOrDie('AMQP_PIPELINE_EXECUTION_QUEUE')
export const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = readEnvOrDie('AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC')
