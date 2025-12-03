import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';
import Notes from '../views/Notes.vue';
import NoteDetail from '../views/NoteDetail.vue';
import NoteEdit from '../views/NoteEdit.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Notes',
    component: Notes,
    meta: { requiresAuth: true }
  },
  {
    path: '/note/:id',
    name: 'NoteDetail',
    component: NoteDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/note/:id/edit',
    name: 'NoteEdit',
    component: NoteEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/note/new',
    name: 'NoteNew',
    component: NoteEdit,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.token) {
    next('/login');
  } else {
    next();
  }
});

export default router;


