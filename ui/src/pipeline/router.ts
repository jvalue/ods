import PipelineOverview from './PipelineOverview.vue'
import PipelineEdit from './PipelineEdit.vue'
import PipelineNotifications from '@/pipeline/notifications/NotificationOverview.vue'

export default [
  {
    path: '/pipelines/new',
    name: 'pipeline-new',
    component: PipelineEdit,
    meta: { title: 'Create new Pipeline', requiresAuth: true, isEditMode: false }
  },
  {
    path: '/pipelines/',
    name: 'pipeline-overview',
    component: PipelineOverview,
    meta: { title: 'Pipeline Overview', requiresAuth: true }
  },
  {
    path: '/pipelines/:pipelineId',
    name: 'pipeline-edit',
    component: PipelineEdit,
    meta: { title: 'Edit Pipeline', requiresAuth: true, isEditMode: true }
  },
  {
    path: '/pipelines/:pipelineId/notifications',
    name: 'notification-overview',
    component: PipelineNotifications,
    meta: { title: 'View Notificiations', requiresAuth: true }
  }
]
