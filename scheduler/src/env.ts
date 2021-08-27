import { readEnvOrDie } from '@jvalue/node-dry-basics';

export const MAX_TRIGGER_RETRIES = +readEnvOrDie('MAX_TRIGGER_RETRIES');
export const CONNECTION_RETRIES = +readEnvOrDie('CONNECTION_RETRIES');
export const CONNECTION_BACKOFF_IN_MS = +readEnvOrDie('CONNECTION_BACKOFF_IN_MS');
export const ADAPTER_SERVICE_URL = readEnvOrDie('ADAPTER_SERVICE_URL');
export const AMQP_URL = readEnvOrDie('AMQP_URL');
export const AMQP_SCHEDULER_EXCHANGE = readEnvOrDie('AMQP_SCHEDULER_EXCHANGE');
export const AMQP_SCHEDULER_QUEUE = readEnvOrDie('AMQP_SCHEDULER_QUEUE');
export const AMQP_DATASOURCE_CONFIG_TOPIC = readEnvOrDie('AMQP_DATASOURCE_CONFIG_TOPIC');
export const AMQP_DATASOURCE_CONFIG_CREATED_TOPIC = readEnvOrDie('AMQP_DATASOURCE_CONFIG_CREATED_TOPIC');
export const AMQP_DATASOURCE_CONFIG_DELETED_TOPIC = readEnvOrDie('AMQP_DATASOURCE_CONFIG_DELETED_TOPIC');
export const AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC = readEnvOrDie('AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC');
