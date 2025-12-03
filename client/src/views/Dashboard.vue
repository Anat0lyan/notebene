<template>
  <div class="dashboard-page">
    <div class="container">
      <Navigation />
      <header class="page-header">
        <div>
          <h1>Мой дашборд</h1>
          <p class="dashboard-date">{{ currentDate }}</p>
        </div>
        <div class="header-actions">
          <button @click="showTaskForm = true" class="btn btn-primary">+ Добавить задачу</button>
          <button @click="handleLogout" class="btn btn-secondary">Выйти</button>
        </div>
      </header>

      <!-- Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Всего задач</div>
        </div>
        <div class="stat-card stat-completed">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">Выполнено</div>
        </div>
        <div class="stat-card stat-today">
          <div class="stat-value">{{ stats.due_today }}</div>
          <div class="stat-label">На сегодня</div>
        </div>
        <div class="stat-card stat-overdue">
          <div class="stat-value">{{ stats.overdue }}</div>
          <div class="stat-label">Просрочено</div>
        </div>
        <div class="stat-card stat-upcoming">
          <div class="stat-value">{{ stats.upcoming }}</div>
          <div class="stat-label">Предстоящие</div>
        </div>
      </div>

      <!-- Filters and Sort -->
      <div class="controls-bar">
        <div class="filters">
          <button
            v-for="filterOption in filterOptions"
            :key="filterOption.value"
            @click="handleFilterChange(filterOption.value)"
            class="filter-btn"
            :class="{ active: filter === filterOption.value }"
          >
            {{ filterOption.label }}
          </button>
        </div>
        <Dropdown
          v-model="sortBy"
          :options="sortOptions"
          @change="handleSortChange"
        />
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск задач..."
          class="input"
        />
      </div>

      <!-- Tasks List -->
      <div v-if="loading" class="loading">Загрузка...</div>
      
      <div v-else-if="displayedTasks.length === 0" class="empty-state">
        <p>Нет задач. Создайте первую задачу!</p>
      </div>

      <div v-else class="tasks-grid">
        <TaskCard
          v-for="task in displayedTasks"
          :key="task.id"
          :task="task"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @open-note="handleOpenNote"
        />
      </div>

      <!-- Task Form Modal -->
      <TaskForm
        v-if="showTaskForm"
        :task="editingTask"
        @close="closeTaskForm"
        @save="handleSaveTask"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTasksStore } from '../stores/tasks';
import { useNotesStore } from '../stores/notes';
import TaskCard from '../components/TaskCard.vue';
import TaskForm from '../components/TaskForm.vue';
import Dropdown from '../components/Dropdown.vue';
import Navigation from '../components/Navigation.vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const tasksStore = useTasksStore();
const notesStore = useNotesStore();
const authStore = useAuthStore();

const showTaskForm = ref(false);
const editingTask = ref(null);
const searchQuery = ref('');
const filter = computed(() => tasksStore.filter);
const sortBy = ref('due_date');

const stats = computed(() => tasksStore.stats);
const tasks = computed(() => tasksStore.tasks);
const loading = computed(() => tasksStore.loading);

const filterOptions = [
  { value: 'all', label: 'Все' },
  { value: 'today', label: 'На сегодня' },
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'overdue', label: 'Просроченные' },
  { value: 'completed', label: 'Выполненные' },
  { value: 'pending', label: 'Активные' }
];

const sortOptions = [
  { value: 'due_date', label: 'По дате' },
  { value: 'priority', label: 'По приоритету' },
  { value: 'created_at', label: 'По дате создания' },
  { value: 'title', label: 'По названию' }
];

const currentDate = computed(() => {
  const date = new Date();
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
});

const displayedTasks = computed(() => {
  let result = [...tasks.value];

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  }

  return result;
});

onMounted(async () => {
  await tasksStore.fetchTasks();
  await tasksStore.fetchStats();
});

const handleFilterChange = async (newFilter) => {
  tasksStore.setFilter(newFilter);
  await tasksStore.fetchTasks();
};

const handleSortChange = async () => {
  await tasksStore.fetchTasks();
};

const handleToggle = async (id) => {
  await tasksStore.toggleTask(id);
};

const handleEdit = (task) => {
  editingTask.value = task;
  showTaskForm.value = true;
};

const handleDelete = async (id) => {
  if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
    await tasksStore.deleteTask(id);
  }
};

const handleSaveTask = async (taskData) => {
  if (editingTask.value) {
    await tasksStore.updateTask(editingTask.value.id, taskData);
  } else {
    await tasksStore.createTask(taskData);
  }
  closeTaskForm();
  await tasksStore.fetchTasks();
};

const closeTaskForm = () => {
  showTaskForm.value = false;
  editingTask.value = null;
};

const handleOpenNote = (noteId) => {
  router.push(`/note/${noteId}`);
};

const handleLogout = () => {
  authStore.logout();
  tasksStore.clearAll();
  window.location.href = '/login';
};
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 20px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 32px;
  color: #333;
  margin: 0 0 8px 0;
}

.dashboard-date {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-completed .stat-value {
  color: #4CAF50;
}

.stat-today .stat-value {
  color: #2196F3;
}

.stat-overdue .stat-value {
  color: #f44336;
}

.stat-upcoming .stat-value {
  color: #FF9800;
}

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.filter-btn:hover {
  background-color: #f5f5f5;
}

.filter-btn.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.search-bar {
  margin-bottom: 20px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>

