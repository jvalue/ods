import { Connection, ConnectionOptions, createConnection, DeleteResult, Repository } from 'typeorm'

import { NotificationRepository } from './notificationRepository'
import { NotificationSummary } from './notificationSummary'
import { SlackConfig, WebhookConfig, FirebaseConfig } from './notificationConfig'
import { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PW, POSTGRES_DB } from '../env'
import { sleep } from '../sleep'

const CONNECTION_OPTIONS: ConnectionOptions = {
  type: 'postgres',
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  username: POSTGRES_USER,
  password: POSTGRES_PW,
  database: POSTGRES_DB,
  synchronize: true,
  // logging: true,
  entities: [
    WebhookConfig,
    SlackConfig,
    FirebaseConfig
  ]
}

/**
 * Initializes the components of the notification storage handler and returns a new storage handler.
 * This is done by establishing a connection to the notification database
 * and initializing all repositories for the notification configs
 *
 * @param retries:  Number of retries to connect to the database
 * @param ms:  Time in seconds to backoff before next connection retry
 */
export async function initStorageHandler (retries: number, ms: number): Promise<StorageHandler> {
  console.debug('Initializing StorageHandler')

  const connection = await initConnection(retries, ms)
  const slackRepository = connection.getRepository(SlackConfig)
  const webhookRepository = connection.getRepository(WebhookConfig)
  const firebaseRepository = connection.getRepository(FirebaseConfig)

  return new StorageHandler(connection, slackRepository, webhookRepository, firebaseRepository)
}

/**
 * Initializes a Database Connection to the notification-db service (postgres)
 * by using the environment vars:
 *          - PGHOST:       IP/hostname of the storage service
 *          - PGPORT:       PORT        of the storage service
 *          - PGPASSWORD:   PASSWORD to connect to the stprage db
 *          - PGUSER:       USER     to connect to the storage db
 *
 * @param retries:  Number of retries to connect to the database
 * @param ms:  Time in seconds to backoff before next connection retry
 *
 * @returns a Promise, that resolves with the established connection or rejects on failure
 */
async function initConnection (retries: number, ms: number): Promise<Connection> {
  // try to establish connection
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await createConnection(CONNECTION_OPTIONS)
      console.info('Connected to notification config database successful.')
      return connection
    } catch (e) {
      console.info(`Initializing database connection (${i}/${retries})`)
      await sleep(ms)
    }
  }
  throw new Error('Connection to database could not be established.')
}

/**
 * This class handles Requests to the notification database
 * in order to store and get notification configurations.
 */
export class StorageHandler implements NotificationRepository {
  constructor (
    private readonly dbConnection: Connection,
    private readonly slackRepository: Repository<SlackConfig>,
    private readonly webhookRepository: Repository<WebhookConfig>,
    private readonly firebaseRepository: Repository<FirebaseConfig>
  ) {
  }

  public async getSlackConfig (id: number): Promise<SlackConfig> {
    const config = await this.slackRepository.findOne(id)
    if (config === undefined) {
      throw new Error(`Could not find slack config with id ${id}`)
    }

    return config
  }

  public async getWebhookConfig (id: number): Promise<WebhookConfig> {
    const config = await this.webhookRepository.findOne(id)
    if (config === undefined) {
      throw new Error(`Could not find webhook config with id ${id}`)
    }

    return config
  }

  public async getFirebaseConfig (id: number): Promise<FirebaseConfig> {
    const config = await this.firebaseRepository.findOne(id)
    if (config === undefined) {
      throw new Error(`Could not find firebase config with id ${id}`)
    }

    return config
  }

  /**
     * This function returns all available Configs in the Database for given pipeline id.
     *
     * @param pipelineId    Id of the pipeline to search configs for
     * @returns Promise containing NotificationSummary (config that contains all configs)
     */
  public async getConfigsForPipeline (pipelineId: number): Promise<NotificationSummary> {
    console.debug(`Getting ConfigSummary for pipeline with id ${pipelineId}.`)

    // Get the configs for given pipeline id
    const slackConfigs = await this.getSlackConfigs(pipelineId)
    const webhookConfigs = await this.getWebhookConfigs(pipelineId)
    const firebaseConfig = await this.getFirebaseConfigs(pipelineId)

    // build the summary
    const notificationSummary: NotificationSummary = {
      slack: slackConfigs,
      webhook: webhookConfigs,
      firebase: firebaseConfig
    }

    console.debug(`Successfully got the all configs for pipeline with id ${pipelineId}`)
    return notificationSummary
  }

  /**
     * Deletes all configs in the database referring to given pipeline id.
     * If one of the deletions fails all changes will be rolled back.
     *
     * @param pipelineId Id of the pipeline to delete the configs for
     */
  public async deleteConfigsForPipelineID (pipelineId: number): Promise<void> {
    console.debug(`Deleting all configs for pipeline id "${pipelineId}"`)

    const condition = { pipelineId: pipelineId }

    this.dbConnection.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.delete(SlackConfig, condition)
      await transactionalEntityManager.delete(WebhookConfig, condition)
      await transactionalEntityManager.delete(FirebaseConfig, condition)
    }).catch(error => {
      console.error(`Could not delete configs with pipelineId ${pipelineId}: ${error}`)
      throw error
    })
  }

  /**
     * Gets all slack config from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the slack configs for
     * @returns Promise containing a list of slack configs with given pipeline id
     */
  public async getSlackConfigs (pipelineId: number): Promise<SlackConfig[]> {
    console.debug(`Getting slack configs with pipelineId ${pipelineId} from database`)

    const slackConfigList = await this.slackRepository.find({ pipelineId: pipelineId })

    console.debug(`Sucessfully got ${slackConfigList.length} Slack config(s) from Database`)
    return slackConfigList
  }

  /**
     * Gets all WebHook Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the WebHook Configs for
     * @returns Promise, containing a list of slack configs with given pipeline id
     */
  public async getWebhookConfigs (pipelineId: number): Promise<WebhookConfig[]> {
    console.debug(`Getting webhook configs with pipelineId ${pipelineId} from database`)

    const webhookConfigs = await this.webhookRepository.find({ pipelineId: pipelineId })

    console.debug(`Successfully got ${webhookConfigs.length} webhookConfigs from Database`)
    return webhookConfigs
  }

  /**
     * Gets all firebase configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the firebase configs for
     * @returns Promise containing a list of firebase configs with given pipeline id
     */
  public async getFirebaseConfigs (pipelineId: number): Promise<FirebaseConfig[]> {
    console.debug(`Getting firebase configs with pipelineId ${pipelineId} from database`)

    const firebaseConfigs = await this.firebaseRepository.find({ pipelineId: pipelineId })

    console.debug(`Successfully got ${firebaseConfigs.length} firebase configs from database`)
    return firebaseConfigs
  }

  /**
     * Persists a webhook config (provided by argument) to the config database
     *
     * @param webhookConfig    webhook config to persist
     * @returns Promise containing the stored webhook config
     */
  public async saveWebhookConfig (webhookConfig: WebhookConfig): Promise<WebhookConfig> {
    console.debug('Saving webhook config to database')

    const config = this.webhookRepository.create(webhookConfig)

    const webhookPromise = this.webhookRepository.save(config)

    console.debug('Successfully persisted webhook config.')
    return await webhookPromise
  }

  /**
     * Persists a slack config (provided by argument) to the config database
     *
     * @param slackConfig    slack config to persist
     * @returns Promise containing the stored slack config
     */
  public async saveSlackConfig (slackConfig: SlackConfig): Promise<SlackConfig> {
    console.debug('Saving slack config to database.')

    const config = this.slackRepository.create(slackConfig)

    const slackPromise = this.slackRepository.save(config)

    console.debug('Successfully persisted slack config')
    return await slackPromise
  }

  /**
     * Persists a firebase config (provided by argument) to the config database
     *
     * @param firebaseConfig    firebase config to persist
     * @returns Promise containing the stored firebase config
     */
  public async saveFirebaseConfig (firebaseConfig: FirebaseConfig): Promise<FirebaseConfig> {
    console.debug('Saving firebase config to database')

    const config = this.firebaseRepository.create(firebaseConfig)
    const firebasePromise = this.firebaseRepository.save(config)

    console.debug('Successfully persisted firebase config')
    return await firebasePromise
  }

  /**
     * Updates a slack config for given id
     *
     * @param id id for the config to be updated
     * @param slackConfig slack config to be written to database
     * @returns Promise containing the result of the update operation
     */
  public async updateSlackConfig (id: number, slackConfig: SlackConfig): Promise<SlackConfig> {
    console.debug('Updating slack config to database')

    await this.slackRepository.update(id, slackConfig)
    console.debug('Successfully updated slack config')
    return await this.getSlackConfig(id)
  }

  /**
     * Updates a webhook config for given id
     *
     * @param id id for the config to be updated
     * @param webhookConfig webhook config to be written to database
     * @returns Promise containing the result of the update operation
     */
  public async updateWebhookConfig (id: number, webhookConfig: WebhookConfig): Promise<WebhookConfig> {
    console.debug('Updating webhook config to database')

    await this.webhookRepository.update(id, webhookConfig)
    console.debug('Succesfully updated webhook config')
    return await this.getWebhookConfig(id)
  }

  /**
     * Updates a Firebase config for given id
     *
     * @param id id for the config to be updated
     * @param firebaseConfig firebase config to be written to database
     * @returns Promise containing the result of the update operation
     */
  public async updateFirebaseConfig (id: number, firebaseConfig: FirebaseConfig): Promise<FirebaseConfig> {
    console.debug('Updating firebase config to database')

    await this.firebaseRepository.update(id, firebaseConfig)
    console.debug('Successfully updated firebase config')
    return await this.getFirebaseConfig(id)
  }

  /**
      * Deletes a slack config for given id
      *
      * @param id id for the config to be deleted
      * @returns result of the deletion execution
      */
  public async deleteSlackConfig (id: number): Promise<void> {
    console.debug(`Deleting slack config with id ${id}`)

    const deleteResult = await this.slackRepository.delete(id)
    if (this.isDeleteError(deleteResult)) {
      throw new Error(`Something went wrong deleting slack config with id ${id}`)
    }
    console.debug(`Successfully deleted slack config with id ${id}`)
  }

  /**
     * Deletes a webhook config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
  public async deleteWebhookConfig (id: number): Promise<void> {
    console.debug(`Deleting webhook config with id ${id}`)

    const deleteResult = await this.webhookRepository.delete(id)
    if (this.isDeleteError(deleteResult)) {
      throw new Error(`Something went wrong deleting webhook config with id ${id}`)
    }
    console.debug(`Successfully deleted webhook config with id ${id}`)
  }

  /**
     * Deletes a firebase config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
  public async deleteFirebaseConfig (id: number): Promise<void> {
    console.debug(`Deleting firebase config with id ${id}`)

    const deleteResult = await this.firebaseRepository.delete(id)
    if (this.isDeleteError(deleteResult)) {
      throw new Error(`Something went wrong deleting firebase config with id ${id}`)
    }
    console.debug(`Successfully deleted firebase config with id ${id}`)
  }

  private isDeleteError (deleteResult: DeleteResult): boolean {
    return deleteResult.affected === undefined || deleteResult.affected === null || deleteResult.affected === 0
  }
}
