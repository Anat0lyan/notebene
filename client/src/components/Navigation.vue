<template>
  <nav class="main-nav">
    <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
      📝 Заметки
    </router-link>
    <router-link to="/dashboard" class="nav-link" :class="{ active: $route.path === '/dashboard' }">
      📊 Дашборд
      <span v-if="pendingTasksCount > 0" class="nav-badge">{{ pendingTasksCount }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useTasksStore } from '../stores/tasks';

const tasksStore = useTasksStore();

const pendingTasksCount = computed(() => {
  const overdue = tasksStore.stats?.overdue || 0;
  const dueToday = tasksStore.stats?.due_today || 0;
  return overdue + dueToday;
});

onMounted(async () => {
  // Load stats when navigation is mounted
  await tasksStore.fetchStats();
});
</script>

<style scoped>
.main-nav {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  text-decoration: none;
  color: #666;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 16px;
  position: relative;
}

.nav-link:hover {
  background-color: #f5f5f5;
  color: #333;
}

.nav-link.active {
  background-color: #e8f5e9;
  color: #4CAF50;
  font-weight: 500;
}

.nav-badge {
  background-color: #f44336;
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}
</style>

