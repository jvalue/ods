import PipelineCreate from './PipelineCreate.vue';
import PipelineEdit from './PipelineEdit.vue';
import PipelineOverview from './PipelineOverview.vue';

export default [
  {
    path: '/pipelines/new/:datasourceId?',
    name: 'pipeline-new',
    component: PipelineCreate,
    meta: {
      title: 'CREATE PIPELINE',
      requiresAuth: true,
      isEditMode: false,
    },
  },
  {
    path: '/pipelines/',
    name: 'pipeline-overview',
    component: PipelineOverview,
    meta: { title: 'PIPELINES', requiresAuth: true },
  },
  {
    path: '/pipelines/:pipelineId',
    name: 'pipeline-edit',
    component: PipelineEdit,
    meta: { title: 'EDIT PIPELINE', requiresAuth: true, isEditMode: true },
  },
];
