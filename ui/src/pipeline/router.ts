import PipelineOverview from './PipelineOverview.vue'

export default [
  {
    path: '/pipeline',
    name: 'pipeline-overview',
    component: PipelineOverview,
    meta: { title: 'Pipeline Overview', requiresAuth: true }
  }
]
