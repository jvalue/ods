const isEmpty = (value: string | undefined): value is undefined => !value || value === ''

const getEnv = (envName: string): string => {
  const env = process.env[envName]
  if (isEmpty(env)) {
    throw new Error(`Required environment variable ${envName} is not defined or empty`)
  }
  return env
}

export const BASE_URL = getEnv('VUE_APP_BASE_URL')
export const STORAGE_SERVICE_URL = getEnv('VUE_APP_STORAGE_SERVICE_URL')
export const ADAPTER_SERVICE_URL = getEnv('VUE_APP_ADAPTER_SERVICE_URL')
export const TRANSFORMATION_SERVICE_URL = getEnv('VUE_APP_TRANSFORMATION_SERVICE_URL')
export const NOTIFICATION_SERVICE_URL = getEnv('VUE_APP_NOTIFICATION_SERVICE_URL')
export const APP_CONFIGURATION_SERVICE_URL = getEnv('VUE_APP_API_CONFIGURATION_SERVICE_URL')
