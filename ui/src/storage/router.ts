import PipelineStorageOverview from './PipelineStorageOverview.vue';

export default [
  {
    path: '/storage/:storageId',
    name: 'pipeline-storage-overview',
    component: PipelineStorageOverview,
    meta: { title: 'STORAGE', requiresAuth: true },
  },
];
