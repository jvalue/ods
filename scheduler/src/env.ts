import { readEnvOrDie } from '@jvalue/node-dry-basics';

export const MAX_TRIGGER_RETRIES = +readEnvOrDie('MAX_TRIGGER_RETRIES');
export const CONNECTION_RETRIES = +readEnvOrDie('CONNECTION_RETRIES');
export const CONNECTION_BACKOFF_IN_MS = +readEnvOrDie(
  'CONNECTION_BACKOFF_IN_MS',
);
export const POSTGRES_HOST = readEnvOrDie('POSTGRES_HOST');
export const POSTGRES_PORT = +readEnvOrDie('POSTGRES_PORT');
export const POSTGRES_USER = readEnvOrDie('POSTGRES_USER');
export const POSTGRES_PW = readEnvOrDie('POSTGRES_PW');
export const POSTGRES_DB = readEnvOrDie('POSTGRES_DB');
export const POSTGRES_SCHEMA = readEnvOrDie('POSTGRES_SCHEMA');
export const POSTGRES_SSL =
  readEnvOrDie('POSTGRES_SSL').toLowerCase() === 'true';
export const ADAPTER_SERVICE_URL = readEnvOrDie('ADAPTER_SERVICE_URL');
export const AMQP_URL = readEnvOrDie('AMQP_URL');
export const AMQP_SCHEDULER_EXCHANGE = readEnvOrDie('AMQP_SCHEDULER_EXCHANGE');
export const AMQP_SCHEDULER_QUEUE = readEnvOrDie('AMQP_SCHEDULER_QUEUE');
export const AMQP_DATASOURCE_CONFIG_TOPIC = readEnvOrDie(
  'AMQP_DATASOURCE_CONFIG_TOPIC',
);
export const AMQP_DATASOURCE_CONFIG_CREATED_TOPIC = readEnvOrDie(
  'AMQP_DATASOURCE_CONFIG_CREATED_TOPIC',
);
export const AMQP_DATASOURCE_CONFIG_DELETED_TOPIC = readEnvOrDie(
  'AMQP_DATASOURCE_CONFIG_DELETED_TOPIC',
);
export const AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC = readEnvOrDie(
  'AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC',
);
export const AMQP_DATASOURCE_IMPORT_TRIGGER_TOPIC = readEnvOrDie(
  'AMQP_DATASOURCE_IMPORT_TRIGGER_TOPIC',
);
export const AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC = readEnvOrDie(
  'AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC',
);
