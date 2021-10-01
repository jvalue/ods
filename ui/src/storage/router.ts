import PipelineStorageOverview from './PipelineStorageOverview.vue';

export default [
  {
    path: '/storage/:storageId',
    name: 'pipeline-storage-overview',
    component: PipelineStorageOverview,
    meta: { title: 'Storage Service', requiresAuth: true },
  },
];
