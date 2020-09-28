import APIConfigurationEdit from '@/api/APIConfigurationEdit.vue'
import APIConfigOverview from '@/api/APIConfigOverview.vue'

export default [
  {
    path: '/apiConfig/new/:pipelineId?',
    name: 'api-config-new',
    component: APIConfigurationEdit,
    meta: { title: 'Create new API Configuration', requiresAuth: true, isEditMode: false }
  },
  {
    path: '/apiConfig',
    name: 'api-config-overview',
    component: APIConfigOverview,
    meta: { title: 'API Configuration Overview', requiresAuth: true }
  },
  {
    path: '/apiConfig/:apiConfigId',
    name: 'api-config-edit',
    component: APIConfigurationEdit,
    meta: { title: 'Edit API Configuration', requiresAuth: true, isEditMode: true }
  }
]
