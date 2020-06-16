import { WebHookConfig, SlackConfig, FirebaseConfig } from './notificationConfig';

export class NotificationSummary{

    webhook: WebHookConfig[]

    slack: SlackConfig[]

    firebase: FirebaseConfig[]
    
    constructor() {
        this.webhook = []
        this.slack = []
        this.firebase = []
    }
}