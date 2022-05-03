import { readEnvOrDie } from '@jvalue/node-dry-basics';

// export const CONNECTION_RETRIES = +readEnvOrDie('CONNECTION_RETRIES');
// export const CONNECTION_BACKOFF = +readEnvOrDie('CONNECTION_BACKOFF_IN_MS');
// export const POSTGRES_HOST = readEnvOrDie('POSTGRES_HOST');
// export const POSTGRES_PORT = +readEnvOrDie('POSTGRES_PORT');
// export const POSTGRES_USER = readEnvOrDie('POSTGRES_USER');
// export const POSTGRES_PW = readEnvOrDie('POSTGRES_PW');
// export const POSTGRES_DB = readEnvOrDie('POSTGRES_DB');
// export const POSTGRES_SCHEMA = readEnvOrDie('POSTGRES_SCHEMA');
//
// export const POSTGRES_SSL =
//   readEnvOrDie('POSTGRES_SSL').toLowerCase() === 'true';
//
// export const AMQP_URL = readEnvOrDie('AMQP_URL');
//
// export const ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC = readEnvOrDie(
//   'ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC',
// );
// export const ADAPTER_AMQP_IMPORT_FAILED_TOPIC = readEnvOrDie(
//   'ADAPTER_AMQP_IMPORT_FAILED_TOPIC',
// );
// export const ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC = readEnvOrDie(
//   'ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC',
// );
// export const ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC = readEnvOrDie(
//   'ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC',
// );
// export const ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC = readEnvOrDie(
//   'ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC',
// );
//
// export const ADAPTER_AMQP_ADAPTER_EXCHANGE = readEnvOrDie(
//   'ADAPTER_AMQP_ADAPTER_EXCHANGE',
// );
//
// export const ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE = readEnvOrDie(
//   'ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE',
// );
// export const ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE_TOPIC = readEnvOrDie(
//   'ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE_TOPIC',
// );
// export const ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC =
//   readEnvOrDie('ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC');
export const CONNECTION_RETRIES=30
export const CONNECTION_BACKOFF=2000
export const POSTGRES_HOST="localhost"//"adapter-db" //localhost for local
export const POSTGRES_PORT="5432"
export const POSTGRES_PW="admin"
export const POSTGRES_USER="adapterservice"
export const POSTGRES_DB="adapterservice"
export const AMQP_URL="amqp://rabbit_adm:R4bb!7_4DM_p4SS@localhost:5672"
export const ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC="datasource.execution.success"
export const ADAPTER_AMQP_IMPORT_FAILED_TOPIC="datasource.execution.failed"
export const ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC="datasource.config.created"
export const ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC="datasource.config.updated"
export const ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC="datasource.config.deleted"
export const ADAPTER_AMQP_ADAPTER_EXCHANGE="ods_global"
export const ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE="adapter.datasource-import-trigger"
export const ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE_TOPIC="datasource.import-trigger.*"
export const ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC="datasource.import-trigger.created"
