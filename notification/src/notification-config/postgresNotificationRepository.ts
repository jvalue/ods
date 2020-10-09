import { PoolConfig, QueryResult } from 'pg'
import PostgresRepository from '@/postgresRepository'
import { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PW, POSTGRES_DB } from '../env'
import { NotificationRepository } from './notificationRepository'
import { NotificationConfig, NotificationParameter, NotificationType } from './notificationConfig'

const TABLE_NAME = 'Notification'

const CREATE_TABLE_STATEMENT = `CREATE TABLE IF NOT EXISTS "${TABLE_NAME}" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "pipelineId" bigint NOT NULL,
  "condition" varchar(500) NOT NULL,
  "type" varchar(50) NOT NULL,
  "parameter" jsonb NOT NULL,
  CONSTRAINT "Notification_pk_${table}" PRIMARY KEY (id)
  )`
const GET_ALL_NOTIFICATIONS_STATEMENT = `SELECT * FROM "${TABLE_NAME}"`
const GET_NOTIFICATION_STATEMENT = `SELECT * FROM "${TABLE_NAME}" WHERE id = $1`
const GET_NOTIFICATION_BY_PIPELINEID_STATEMENT = `SELECT * FROM "${TABLE_NAME}" WHERE pipelineId = $1`
const INSERT_NOTIFICATION_STATEMENT = `INSERT INTO "${TABLE_NAME}" ("pipelineId", "condition", "type", "parameter") VALUES ($1, $2, $3) RETURNING *`
const UPDATE_NOTIFICATION_STATEMENT = `UPDATE "${TABLE_NAME}" SET "pipelineId"=$2, "condition"=$3, "type"=$4, "parameter"=$5 WHERE "id"=$1 RETURNING *`
const DELETE_NOTIFICATION_STATEMENT = `DELETE FROM "${TABLE_NAME}" WHERE "id"=$1 RETURNING *`

interface DatabaseNotification {
  id: string
  pipelineId: string
  condition: string
  type: string
  parameter: DatabaseSlackParameter | DatabaseWebhookParameter | DatabaseFirebaseParameter
}

export interface DatabaseSlackParameter {
  workspaceId: string
  channelId: string
  secret: string
}

export interface DatabaseWebhookParameter {
  url: string
}

export interface DatabaseFirebaseParameter {
  projectId: string
  clientEmail: string
  privateKey: string
  topic: string
}

export class PostgresNotificationRepository implements NotificationRepository {
  constructor (private readonly postgresRepository: PostgresRepository) {}

  /**
     * Initializes the connection to the database.
     * @param retries:  Number of retries to connect to the database
     * @param backoffMs:  Time in seconds to backoff before next connection retry
     */
  public async init (retries: number, backoffMs: number): Promise<void> {
    console.debug('Initializing PostgresNotificationRepository')

    const poolConfig: PoolConfig = {
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PW,
      database: POSTGRES_DB,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: backoffMs
    }

    await this.postgresRepository.init(poolConfig, retries, backoffMs)
    await this.postgresRepository.executeQuery(CREATE_TABLE_STATEMENT, [])
  }

  async getForPipeline (pipelineId: number): Promise<NotificationConfig[]> {
    const resultSet: QueryResult<DatabaseNotification> =
      await this.postgresRepository.executeQuery(GET_NOTIFICATION_BY_PIPELINEID_STATEMENT, [ pipelineId ])
    return this.toNotifications(resultSet)
  }

  async getById (id: number): Promise<NotificationConfig | undefined> {
    const resultSet: QueryResult<DatabaseNotification> =
      await this.postgresRepository.executeQuery(GET_NOTIFICATION_STATEMENT, [ id ])
    return this.toNotifications(resultSet)[0]
  }

  async getAll (): Promise<NotificationConfig[]> {
    const resultSet: QueryResult<DatabaseNotification> =
      await this.postgresRepository.executeQuery(GET_ALL_NOTIFICATIONS_STATEMENT, [])
    return this.toNotifications(resultSet)
  }

  create (config: NotificationConfig): Promise<NotificationConfig> {

  }

  update (id: number, config: NotificationConfig): Promise<NotificationConfig> {

  }

  delete (id: number): Promise<void> {

  }

  private toNotifications (resultSet: QueryResult<DatabaseNotification>): NotificationConfig[] {
    const contents: DatabaseNotification[] = resultSet.rows
    return contents.map(x => {
      const notificationType: NotificationType = NotificationType[x.type as keyof typeof NotificationType]
      let parameter: NotificationParameter
      switch (notificationType) {
        case NotificationType.WEBHOOK:
          parameter = { ...x.parameter as DatabaseWebhookParameter }
          break
        case NotificationType.SLACK:
          parameter = { ...x.parameter as DatabaseSlackParameter }
          break
        case NotificationType.FCM:
          parameter = { ...x.parameter as DatabaseFirebaseParameter }
          break
        default:
          throw Error(`Could not load notification type ${notificationType} from database - type unknown!`)
      }

      return {
        ...x,
        id: parseInt(x.id),
        pipelineId: parseInt(x.pipelineId),,
        type: notificationType,
        parameter: parameter
      }
    })
  }
}
