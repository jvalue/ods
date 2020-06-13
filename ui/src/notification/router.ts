import PipelineNotifications from '@/notification/NotificationOverview.vue'

export default [
  {
    path: '/pipelines/:pipelineId/notifications',
    name: 'notification-overview',
    component: PipelineNotifications,
    meta: { title: 'View Notificiations', requiresAuth: true }
  }
]
