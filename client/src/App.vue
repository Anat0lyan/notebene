<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();

onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    authStore.setToken(token);
  }
});
</script>


