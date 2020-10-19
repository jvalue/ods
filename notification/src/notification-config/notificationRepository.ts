import { NotificationConfig } from './notificationConfig'

export interface NotificationRepository {
  getForPipeline: (pipelineId: number) => Promise<NotificationConfig[]>

  getById: (id: number) => Promise<NotificationConfig | undefined>
  getAll: () => Promise<NotificationConfig[]>
  create: (config: NotificationConfig) => Promise<NotificationConfig>
  update: (id: number, config: NotificationConfig) => Promise<NotificationConfig>
  delete: (id: number) => Promise<void>
}
