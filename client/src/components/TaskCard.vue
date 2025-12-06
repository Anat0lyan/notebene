<template>
  <div class="task-card card" :class="{ completed: task.completed, overdue: isOverdue }">
    <div class="task-header">
      <div class="task-checkbox-container">
        <input
          type="checkbox"
          :checked="task.completed"
          @change="handleToggle"
          class="task-checkbox"
        />
        <h3 :class="{ completed: task.completed }">{{ task.title }}</h3>
      </div>
      <div class="task-priority" :class="`priority-${task.priority}`">
        {{ priorityLabel }}
      </div>
    </div>

    <p v-if="task.description" class="task-description" :class="{ completed: task.completed }">
      {{ task.description }}
    </p>

    <div class="task-meta">
      <div v-if="task.due_date" class="task-due-date" :class="{ overdue: isOverdue }">
        📅 {{ formatDate(task.due_date) }}
        <span v-if="isOverdue" class="overdue-badge">Просрочено</span>
      </div>
      
      <div v-if="task.note_title" class="task-note-link" @click="handleOpenNote">
        📝 {{ task.note_title }}
      </div>
    </div>

    <div class="task-actions">
      <button @click="handleEdit" class="btn-icon" title="Редактировать">
        ✏️
      </button>
      <button @click="handleDelete" class="btn-icon" title="Удалить">
        🗑️
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['toggle', 'edit', 'delete', 'open-note']);

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий'
};

const priorityLabel = computed(() => priorityLabels[props.task.priority] || props.task.priority);

const isOverdue = computed(() => {
  if (props.task.completed || !props.task.due_date) return false;
  const dueDate = new Date(props.task.due_date);
  const now = new Date();
  return dueDate < now;
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Завтра';
  }
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

const handleToggle = () => {
  emit('toggle', props.task.id);
};

const handleEdit = () => {
  emit('edit', props.task);
};

const handleDelete = () => {
  emit('delete', props.task.id);
};

const handleOpenNote = () => {
  if (props.task.note_id) {
    emit('open-note', props.task.note_id);
  }
};
</script>

<style scoped>
.task-card {
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.task-card.completed {
  opacity: 0.7;
  background-color: #f5f5f5;
}

.task-card.overdue:not(.completed) {
  border-left: 4px solid #f44336;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.task-checkbox-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.task-card h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex: 1;
}

.task-card h3.completed {
  text-decoration: line-through;
  color: #999;
}

.task-priority {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
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

.task-description {
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.task-description.completed {
  text-decoration: line-through;
  color: #999;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 14px;
}

.task-due-date {
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-due-date.overdue {
  color: #f44336;
  font-weight: 500;
}

.overdue-badge {
  padding: 2px 8px;
  background-color: #f44336;
  color: white;
  border-radius: 10px;
  font-size: 11px;
}

.task-note-link {
  color: #4CAF50;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

.task-note-link:hover {
  color: #45a049;
}

.task-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
</style>



