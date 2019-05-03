import TransformationMain from './TransformationMain.vue';

export default [
  {
    path: '/transformation',
    name: 'transformation',
    component: TransformationMain,
    meta: { title: 'Transformation Service', requiresAuth: true },
  },
];
