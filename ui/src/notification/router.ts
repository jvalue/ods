import PipelineNotifications from './NotificationOverview.vue'
import NotificationCreate from './NotificationCreate.vue'
import NotificationEdit from './NotificationEdit.vue'

export default [
  {
    path: '/pipelines/:pipelineId/notifications',
    name: 'notification-overview',
    component: PipelineNotifications,
    meta: { title: 'View Notificiations', requiresAuth: true }
  }, {
    path: '/pipelines/:pipelineId/notifications/new',
    name: 'notification-create',
    component: NotificationCreate,
    meta: { title: 'Create Notificiation', requiresAuth: true }
  }, {
    path: '/pipelines/:pipelineId/notifications/:notificationId/edit',
    name: 'notification-edit',
    component: NotificationEdit,
    meta: { title: 'Edit Notificiation', requiresAuth: true }
  }
]
