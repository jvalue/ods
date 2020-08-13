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

export const INITIAL_CONNECTION_RETRIES = +getEnv('INITIAL_CONNECTION_RETRIES')
export const INITIAL_CONNECTION_RETRY_BACKOFF = +getEnv('INITIAL_CONNECTION_RETRY_BACKOFF')
