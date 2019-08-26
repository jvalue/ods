import PipelineOverview from './PipelineOverview.vue'
import PipelineEdit from './PipelineEdit.vue'

export default [
  {
    path: '/pipeline',
    name: 'pipeline-overview',
    component: PipelineOverview,
    meta: { title: 'Pipeline Overview', requiresAuth: true }
  },
  {
    path: '/pipeline/new',
    name: 'pipeline-new',
    component: PipelineEdit,
    meta: { title: 'Create new Pipeline', requiresAuth: true, isEditMode: false }
  },
  {
    path: '/pipeline/edit',
    name: 'pipeline-edit',
    component: PipelineEdit,
    meta: { title: 'Edit Pipeline', requiresAuth: true, isEditMode: true }
  }
]
