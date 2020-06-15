import { SlackConfig, WebHookConfig, FirebaseConfig } from './interfaces/notificationConfig';
import { Connection, ConnectionOptions, createConnection, getConnection } from 'typeorm';
import { NotificationSummary} from './interfaces/notificationSummary';
import { NotificationRepository } from './interfaces/notificationRepository';

/**=============================================================================================================
 * This class handles Requests to the Nofification Database
 * in order to store and get Notification Configurations.
 *==============================================================================================================*/
export class StorageHandler implements NotificationRepository {

    private connectionOptions: ConnectionOptions = {
      type: "postgres",
      host: process.env.PGHOST,
      port: +process.env.PGPORT!,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGUSER,
      synchronize: true,
      // logging: true,
      entities: [
          WebHookConfig,
          SlackConfig,
          FirebaseConfig
      ]
    }

    constructor() { }
    /**===========================================================================================
     * Initializes a Database Connection to the notification-db service (postgres)
     * by using the Environment variables:
     *          - PGHOST:       IP/hostname of the storage service
     *          - PGPORT:       PORT        of the storage service
     *          - PGPASSWORD:   PASSWORD to connect to the stprage db
     *          - PGUSER:       USER     to connect to the storage db
     *
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     *
     * @returns     a Promise, containing either a Connection on success or null on failure
     *===========================================================================================*/
    public async initConnection(retries: number, backoff: number): Promise<void> {
        var dbCon: null | Connection = null
        var connected: boolean = false

        // try to establish connection
        for (let i = 0; i < retries; i++) {
            dbCon = await createConnection(this.connectionOptions).catch(() => { return null })
            if (!dbCon) {
                console.info(`DB Connection could not be initialized. Retrying in ${backoff} seconds`)
                await this.backOff(backoff);
            } else {
                connected = true
                break;
            }
        }

        if (!connected) {
            return Promise.reject("Connection to databse could not be established.")
        }
        return Promise.resolve()
    }

    /**
     *
     * @param pipelineId
     */
    public async getConfigsForPipeline(pipelineId: number): Promise<NotificationSummary> {
        console.log(`Getting ConfigSummary for Pipeline with id ${pipelineId}.`)

        const notificationSummary = new NotificationSummary

        const slackConfigs = await this.getSlackConfigs(pipelineId)
        const webHookConfigs = await this.getWebHookConfigs(pipelineId)
        const firebaseConfig = await this.getFirebaseConfigs(pipelineId)

        notificationSummary.slack = slackConfigs
        notificationSummary.webhook = webHookConfigs
        notificationSummary.firebase = firebaseConfig

        return notificationSummary
    }

    /**===========================================================================================
     * Gets all Slack Config from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the Slack Configs for
     *============================================================================================*/
    public async getSlackConfigs(pipelineId: number): Promise<SlackConfig[]> {
        console.log(`Getting Slack Configs with pipelineId ${pipelineId} from Database`)
        var slackConfigList: SlackConfig[] = []

        try {
            const repository = getConnection().getRepository(SlackConfig)
            slackConfigList = await repository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${slackConfigList.length} Slack config(s) from Database`)
        return slackConfigList
    }

    /**===========================================================================================
     * Gets all WebHook Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the WebHook Configs for
     *============================================================================================*/
    public async getWebHookConfigs(pipelineId: number): Promise<WebHookConfig[]> {
        console.log(`Getting WebHook Configs with pipelineId ${pipelineId} from Database`)
        var webHookConfigs: WebHookConfig[] = []

        try {
            const repository = getConnection().getRepository(WebHookConfig)
            webHookConfigs = await repository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${webHookConfigs.length} WebhookConfigs from Database`)
        return webHookConfigs
    }

    /**===========================================================================================
     * Gets all Firebase Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the Firebase Configs for
     *============================================================================================*/
    public async getFirebaseConfigs(pipelineId: number): Promise<FirebaseConfig[]> {
        console.log(`Getting Firebase Configs with pipelineId ${pipelineId} from Database`)
        var firebaseConfigs: FirebaseConfig[] = []

        try {
            const repository = getConnection().getRepository(FirebaseConfig)
            firebaseConfigs = await repository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${firebaseConfigs.length} Firebase configs from Database`)
        return firebaseConfigs
    }

    /**===============================================================
     * TODO: Document
     *
     *===============================================================*/
    public saveWebhookConfig(webhookConfig: WebHookConfig): Promise<WebHookConfig> {
        const postRepository = getConnection().getRepository(WebHookConfig)
        webhookConfig = postRepository.create(webhookConfig)

        return postRepository.save(webhookConfig);
    }

    /**===============================================================
     * TODO: Document
     *
     *===============================================================*/
    public saveSlackConfig(slackConfig: SlackConfig): Promise<SlackConfig>  {
        const postRepository = getConnection().getRepository(SlackConfig)
        slackConfig = postRepository.create(slackConfig)

        return postRepository.save(slackConfig);
    }

    /**===============================================================
     * TODO: Document
     *
     *===============================================================*/
    public saveFirebaseConfig(firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>  {
        const postRepository = getConnection().getRepository(FirebaseConfig)
        firebaseConfig = postRepository.create(firebaseConfig)

        return postRepository.save(firebaseConfig);
    }

    /**====================================================================
     * Waits for a specific time period
     *
     * @param backOff   Period to wait in seconds
     *====================================================================*/
    private backOff(backOff: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, backOff * 1000));
  }

}
