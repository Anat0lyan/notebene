<template>
  <div class="modal" @click.self="handleClose">
    <div class="modal-content task-form-modal">
      <div class="modal-header">
        <h2>{{ isEdit ? 'Редактировать задачу' : 'Новая задача' }}</h2>
        <button @click="handleClose" class="modal-close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="task-form">
        <div class="form-group">
          <label>Название задачи *</label>
          <input
            v-model="form.title"
            type="text"
            class="input"
            placeholder="Введите название задачи"
            required
          />
        </div>

        <div class="form-group">
          <label>Описание</label>
          <textarea
            v-model="form.description"
            class="textarea"
            placeholder="Описание задачи (опционально)"
            rows="4"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Дата выполнения</label>
            <input
              v-model="form.dueDate"
              type="datetime-local"
              class="input"
            />
          </div>

          <div class="form-group">
            <label>Приоритет</label>
            <select v-model="form.priority" class="input">
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Привязать к заметке</label>
          <select v-model="form.noteId" class="input">
            <option :value="null">Без привязки</option>
            <option v-for="note in notes" :key="note.id" :value="note.id">
              {{ note.title || 'Без названия' }}
            </option>
          </select>
        </div>

        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn btn-secondary">
            Отмена
          </button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotesStore } from '../stores/notes';

const props = defineProps({
  task: {
    type: Object,
    default: null
  },
  initialNoteId: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['close', 'save']);

const notesStore = useNotesStore();
const saving = ref(false);

const isEdit = computed(() => !!props.task);

const form = ref({
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium',
  noteId: null
});

onMounted(async () => {
  await notesStore.fetchNotes();
  
  if (isEdit.value) {
    form.value = {
      title: props.task.title || '',
      description: props.task.description || '',
      dueDate: props.task.due_date ? formatDateTimeLocal(props.task.due_date) : '',
      priority: props.task.priority || 'medium',
      noteId: props.task.note_id || null
    };
  } else if (props.initialNoteId) {
    form.value.noteId = props.initialNoteId;
  }
});

const formatDateTimeLocal = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const notes = computed(() => notesStore.notes);

const handleSubmit = async () => {
  saving.value = true;
  try {
    const taskData = {
      title: form.value.title,
      description: form.value.description || null,
      dueDate: form.value.dueDate || null,
      priority: form.value.priority,
      noteId: form.value.noteId || null
    };
    
    emit('save', taskData);
  } catch (error) {
    console.error('Error saving task:', error);
    alert('Ошибка при сохранении задачи');
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.task-form-modal {
  max-width: 600px;
  width: 90%;
}

.task-form {
  margin-top: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

