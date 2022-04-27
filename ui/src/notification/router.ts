import NotificationCreate from './NotificationCreate.vue';
import NotificationEdit from './NotificationEdit.vue';
import PipelineNotifications from './NotificationOverview.vue';

export default [
  {
    path: '/pipelines/:pipelineId/notifications',
    name: 'notification-overview',
    component: PipelineNotifications,
    meta: { title: 'NOTIFICATIONS', requiresAuth: true },
  },
  {
    path: '/pipelines/:pipelineId/notifications/new',
    name: 'notification-create',
    component: NotificationCreate,
    meta: { title: 'CREATE NOTIFICATION', requiresAuth: true },
  },
  {
    path: '/pipelines/:pipelineId/notifications/:notificationId/edit',
    name: 'notification-edit',
    component: NotificationEdit,
    meta: { title: 'EDIT NOTIFICATION', requiresAuth: true },
  },
];
