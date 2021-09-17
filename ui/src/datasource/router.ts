import DatasourceCreate from './DatasourceCreate.vue';
import DatasourceEdit from './DatasourceEdit.vue';
import DatasourceOverview from './DatasourceOverview.vue';

export default [
  {
    path: '/datasources',
    name: 'datasource-overview',
    component: DatasourceOverview,
    meta: { title: 'Datasource Overview', requiresAuth: true },
  },
  {
    path: '/datasources/new',
    name: 'datasource-new',
    component: DatasourceCreate,
    meta: { title: 'Create new Datasource', requiresAuth: true },
  },
  {
    path: '/datasources/:datasourceId',
    name: 'datasource-edit',
    component: DatasourceEdit,
    meta: { title: 'Edit Datasource', requiresAuth: true },
  },
];
