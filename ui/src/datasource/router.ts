import DatasourceOverview from './DatasourceOverview.vue'
import DatasourceEdit from './DatasourceEdit.vue'

export default [
  {
    path: '/datasources',
    name: 'datasource-overview',
    component: DatasourceOverview,
    meta: { title: 'Datasource Overview', requiresAuth: true }
  },
  {
    path: '/datasources/new',
    name: 'datasource-new',
    component: DatasourceEdit,
    meta: { title: 'Create new Datasource', requiresAuth: true, isEditMode: false }
  },
  {
    path: '/datasources/:datasourceId',
    name: 'datasource-edit',
    component: DatasourceEdit,
    meta: { title: 'Edit Datasource', requiresAuth: true, isEditMode: true }
  }
]
