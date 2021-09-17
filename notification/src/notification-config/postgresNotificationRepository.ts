import { PostgresClient } from '@jvalue/node-dry-pg';
import { PoolConfig, QueryResult } from 'pg';

import { POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_PW, POSTGRES_SSL, POSTGRES_USER } from '../env';

import { NotificationConfig, isValidNotificationConfig } from './notificationConfig';
import { NotificationRepository } from './notificationRepository';

const TABLE_NAME = 'Notification';

const CREATE_TABLE_STATEMENT = `CREATE TABLE IF NOT EXISTS "${TABLE_NAME}" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "pipelineId" bigint NOT NULL,
  "condition" varchar(500) NOT NULL,
  "type" varchar(50) NOT NULL,
  "parameter" jsonb NOT NULL,
  CONSTRAINT "Notification_pk" PRIMARY KEY (id)
  )`;
const GET_ALL_NOTIFICATIONS_STATEMENT = `SELECT * FROM "${TABLE_NAME}"`;
const GET_NOTIFICATION_STATEMENT = `SELECT * FROM "${TABLE_NAME}" WHERE "id" = $1`;
const GET_NOTIFICATION_BY_PIPELINEID_STATEMENT = `SELECT * FROM "${TABLE_NAME}" WHERE "pipelineId" = $1`;
const INSERT_NOTIFICATION_STATEMENT = `INSERT INTO "${TABLE_NAME}" ("pipelineId", "condition", "type", "parameter") VALUES ($1, $2, $3, $4) RETURNING *`;
const UPDATE_NOTIFICATION_STATEMENT = `UPDATE "${TABLE_NAME}" SET "pipelineId"=$2, "condition"=$3, "type"=$4, "parameter"=$5 WHERE "id"=$1 RETURNING *`;
const DELETE_NOTIFICATION_STATEMENT = `DELETE FROM "${TABLE_NAME}" WHERE "id"=$1 RETURNING *`;

interface DatabaseNotification {
  id: string;
  pipelineId: string;
  condition: string;
  type: string;
  parameter: Record<string, unknown>;
}

const POOL_CONFIG: PoolConfig = {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PW,
  database: POSTGRES_DB,
  ssl: POSTGRES_SSL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export class PostgresNotificationRepository implements NotificationRepository {
  private readonly postgresClient = new PostgresClient(POOL_CONFIG);

  /**
   * Initializes the connection to the database.
   * @param retries:  Number of retries to connect to the database
   * @param backoffMs:  Time in seconds to backoff before next connection retry
   */
  async init(retries: number, backoffMs: number): Promise<void> {
    console.debug('Initializing PostgresNotificationRepository');

    await this.postgresClient.waitForConnection(retries, backoffMs);
    await this.postgresClient.executeQuery(CREATE_TABLE_STATEMENT);
  }

  async getForPipeline(pipelineId: number): Promise<NotificationConfig[]> {
    const resultSet = (await this.postgresClient.executeQuery(GET_NOTIFICATION_BY_PIPELINEID_STATEMENT, [
      pipelineId,
    ])) as QueryResult<DatabaseNotification>;
    return this.deserializeNotifications(resultSet);
  }

  async getById(id: number): Promise<NotificationConfig | undefined> {
    const resultSet = (await this.postgresClient.executeQuery(GET_NOTIFICATION_STATEMENT, [
      id,
    ])) as QueryResult<DatabaseNotification>;
    return this.deserializeNotifications(resultSet)[0];
  }

  async getAll(): Promise<NotificationConfig[]> {
    const resultSet = (await this.postgresClient.executeQuery(
      GET_ALL_NOTIFICATIONS_STATEMENT,
    )) as QueryResult<DatabaseNotification>;
    return this.deserializeNotifications(resultSet);
  }

  async create(config: NotificationConfig): Promise<NotificationConfig> {
    const parameter = this.escapeQuotes(config.parameter);
    const values = [config.pipelineId, config.condition, config.type, parameter];

    const resultSet = (await this.postgresClient.executeQuery(
      INSERT_NOTIFICATION_STATEMENT,
      values,
    )) as QueryResult<DatabaseNotification>;
    const notifications = this.deserializeNotifications(resultSet);
    if (notifications.length === 0) {
      throw Error(`Could not create notification config: ${JSON.stringify(config)}`);
    }

    return notifications[0];
  }

  async update(id: number, config: NotificationConfig): Promise<NotificationConfig> {
    const parameter = this.escapeQuotes(config.parameter);
    const values = [id, config.pipelineId, config.condition, config.type, parameter];

    const resultSet = (await this.postgresClient.executeQuery(
      UPDATE_NOTIFICATION_STATEMENT,
      values,
    )) as QueryResult<DatabaseNotification>;
    const notifications = this.deserializeNotifications(resultSet);
    if (notifications.length === 0) {
      throw Error(`Could not update notification config: ${JSON.stringify(config)}`);
    }

    return notifications[0];
  }

  async delete(id: number): Promise<void> {
    const resultSet = (await this.postgresClient.executeQuery(DELETE_NOTIFICATION_STATEMENT, [
      id,
    ])) as QueryResult<DatabaseNotification>;

    if (resultSet.rowCount === 0) {
      throw Error(`Could not delete notification config with id ${id}`);
    }
  }

  private escapeQuotes(data: unknown): string {
    return JSON.stringify(data).replace("'", "''");
  }

  private deserializeNotifications(resultSet: QueryResult<DatabaseNotification>): NotificationConfig[] {
    const contents: DatabaseNotification[] = resultSet.rows;
    const notificationsUntyped = contents.map((x) => {
      return {
        ...x,
        id: Number.parseInt(x.id, 10),
        pipelineId: Number.parseInt(x.pipelineId, 10),
      };
    });

    return notificationsUntyped.map((x) => {
      if (!isValidNotificationConfig(x)) {
        throw new Error(`Could not parse notification config from database: ${JSON.stringify(x)}`);
      }
      return x;
    });
  }
}

export const initNotificationRepository = async (
  retries: number,
  backkoffMs: number,
): Promise<NotificationRepository> => {
  const notificationRepository: PostgresNotificationRepository = new PostgresNotificationRepository();
  await notificationRepository.init(retries, backkoffMs);
  return notificationRepository;
};
