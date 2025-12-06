<template>
  <div class="note-tasks">
    <div class="note-tasks-header">
      <h3>Связанные задачи</h3>
      <button @click="showCreateTask = true" class="btn btn-primary" style="font-size: 14px; padding: 6px 12px;">
        + Создать задачу
      </button>
    </div>
    
    <div v-if="loading" class="loading">Загрузка задач...</div>
    
    <div v-else-if="tasks.length === 0" class="no-tasks">
      <p>Нет связанных задач</p>
    </div>
    
    <div v-else class="tasks-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
        :class="{ completed: task.completed }"
      >
        <input
          type="checkbox"
          :checked="task.completed"
          @change="handleToggle(task.id)"
          class="task-checkbox"
        />
        <div class="task-info">
          <span :class="{ completed: task.completed }" @click="goToDashboard">{{ task.title }}</span>
          <div class="task-meta-small">
            <span v-if="task.due_date" class="task-date">
              📅 {{ formatDate(task.due_date) }}
            </span>
            <span class="task-priority-small" :class="`priority-${task.priority}`">
              {{ priorityLabel(task.priority) }}
            </span>
          </div>
        </div>
        <button @click="handleDelete(task.id)" class="btn-icon-small" title="Удалить">🗑️</button>
      </div>
    </div>

    <TaskForm
      v-if="showCreateTask"
      :initial-note-id="noteId"
      @close="showCreateTask = false"
      @save="handleCreateTask"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTasksStore } from '../stores/tasks';
import TaskForm from './TaskForm.vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const props = defineProps({
  noteId: {
    type: String,
    required: true
  }
});

const router = useRouter();
const tasksStore = useTasksStore();

const tasks = ref([]);
const loading = ref(false);
const showCreateTask = ref(false);

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий'
};

const priorityLabel = (priority) => priorityLabels[priority] || priority;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня';
  }
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  });
};

const fetchTasks = async () => {
  loading.value = true;
  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('noteId', '==', props.noteId)
    );
    
    const snapshot = await getDocs(q);
    const tasksData = [];
    
    for (const docSnap of snapshot.docs) {
      const taskData = { id: docSnap.id, ...docSnap.data() };
      
      // Convert Firestore timestamps
      if (taskData.createdAt) {
        taskData.created_at = taskData.createdAt.toDate ? taskData.createdAt.toDate().toISOString() : taskData.createdAt;
      }
      if (taskData.updatedAt) {
        taskData.updated_at = taskData.updatedAt.toDate ? taskData.updatedAt.toDate().toISOString() : taskData.updatedAt;
      }
      if (taskData.dueDate) {
        taskData.due_date = taskData.dueDate.toDate ? taskData.dueDate.toDate().toISOString() : taskData.dueDate;
      }
      
      tasksData.push(taskData);
    }
    
    // Sort by due date
    tasksData.sort((a, b) => {
      const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
      const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
      return aDate - bDate;
    });
    
    tasks.value = tasksData;
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    loading.value = false;
  }
};

const handleToggle = async (id) => {
  await tasksStore.toggleTask(id);
  await fetchTasks();
};

const handleDelete = async (id) => {
  if (confirm('Удалить эту задачу?')) {
    await tasksStore.deleteTask(id);
    await fetchTasks();
  }
};

const handleCreateTask = async (taskData) => {
  await tasksStore.createTask(taskData);
  showCreateTask.value = false;
  await fetchTasks();
};

const goToDashboard = () => {
  router.push('/dashboard');
};

onMounted(async () => {
  await fetchTasks();
});

watch(() => props.noteId, async () => {
  await fetchTasks();
});
</script>

<style scoped>
.note-tasks {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #eee;
}

.note-tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.note-tasks-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.task-item:hover {
  background: #f0f0f0;
}

.task-item.completed {
  opacity: 0.7;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-info > span {
  cursor: pointer;
  color: #333;
  font-size: 14px;
}

.task-info > span.completed {
  text-decoration: line-through;
  color: #999;
}

.task-info > span:hover {
  color: #4CAF50;
}

.task-meta-small {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.task-date {
  display: flex;
  align-items: center;
}

.task-priority-small {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.priority-high {
  background-color: #ffebee;
  color: #c62828;
}

.priority-medium {
  background-color: #fff3e0;
  color: #e65100;
}

.priority-low {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.btn-icon-small {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 14px;
}

.btn-icon-small:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.no-tasks {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>



