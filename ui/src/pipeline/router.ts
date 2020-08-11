import PipelineOverview from './PipelineOverview.vue'
import PipelineEdit from './PipelineEdit.vue'

export default [
  {
    path: '/pipelines/new/:datasourceId?',
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
  }
]
