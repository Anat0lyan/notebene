import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([]);
  const stats = ref({
    total: 0,
    completed: 0,
    due_today: 0,
    overdue: 0,
    upcoming: 0
  });
  const loading = ref(false);
  const filter = ref('all');
  const sortBy = ref('due_date');
  const sortOrder = ref('ASC');

  const filteredTasks = computed(() => {
    let result = [...tasks.value];

    // Filter is applied on backend, but we can add client-side filtering here if needed
    
    return result;
  });

  const fetchTasks = async (filterParam = null, sortParam = null, orderParam = null) => {
    loading.value = true;
    try {
      const params = {
        filter: filterParam || filter.value,
        sort: sortParam || sortBy.value,
        order: orderParam || sortOrder.value
      };
      const response = await api.get('/tasks', { params });
      tasks.value = response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      loading.value = false;
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/tasks/stats');
      stats.value = response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTask = async (id) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      tasks.value.push(response.data);
      await fetchStats();
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      const index = tasks.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks.value[index] = response.data;
      }
      await fetchStats();
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      tasks.value = tasks.value.filter(t => t.id !== id);
      await fetchStats();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const toggleTask = async (id) => {
    try {
      const response = await api.patch(`/tasks/${id}/toggle`);
      const index = tasks.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks.value[index] = response.data;
      }
      await fetchStats();
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  };

  const setFilter = (newFilter) => {
    filter.value = newFilter;
  };

  const setSort = (sort, order) => {
    sortBy.value = sort;
    sortOrder.value = order;
  };

  const clearAll = () => {
    tasks.value = [];
    stats.value = { total: 0, completed: 0, due_today: 0, overdue: 0, upcoming: 0 };
    loading.value = false;
    filter.value = 'all';
  };

  return {
    tasks,
    stats,
    loading,
    filter,
    sortBy,
    sortOrder,
    filteredTasks,
    fetchTasks,
    fetchStats,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    setFilter,
    setSort,
    clearAll
  };
});

