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

export const MAX_TRIGGER_RETRIES = +getEnv('MAX_TRIGGER_RETRIES')
export const CONNECTION_RETRIES = +getEnv('CONNECTION_RETRIES')
export const CONNECTION_BACKOFF_IN_MS = +getEnv('CONNECTION_BACKOFF_IN_MS')
export const ADAPTER_SERVICE_URL = getEnv('ADAPTER_SERVICE_URL')
