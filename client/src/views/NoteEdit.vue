<template>
  <div class="note-edit-page">
    <div class="container">
      <div class="note-edit-card card">
        <div class="form-header">
          <h2>{{ isEdit ? 'Редактировать заметку' : 'Новая заметка' }}</h2>
          <button @click="$router.back()" class="btn-icon">✕</button>
        </div>

        <form @submit.prevent="handleSubmit" class="note-form">
          <div class="form-group">
            <label>Заголовок</label>
            <input
              v-model="form.title"
              type="text"
              class="input"
              placeholder="Введите заголовок"
              required
            />
          </div>

          <div class="form-group">
            <label>Содержимое</label>
            <textarea
              v-model="form.content"
              class="textarea"
              placeholder="Введите содержимое заметки"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Теги</label>
            <TagInput
              v-model="form.tags"
              :suggestions="tagSuggestions"
            />
          </div>

          <div class="form-actions">
            <button type="button" @click="$router.back()" class="btn btn-secondary">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '../stores/notes';
import TagInput from '../components/TagInput.vue';

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();

const isEdit = computed(() => route.name === 'NoteEdit' && route.params.id);
const saving = ref(false);

const form = ref({
  title: '',
  content: '',
  tags: []
});

const tagSuggestions = computed(() => notesStore.tags.map(t => t.name));

onMounted(async () => {
  await notesStore.fetchTags();
  
  if (isEdit.value) {
    try {
      const note = await notesStore.fetchNote(route.params.id);
      form.value = {
        title: note.title || '',
        content: note.content || '',
        tags: note.tags.map(t => t.name) || []
      };
    } catch (error) {
      console.error('Error loading note:', error);
      router.push('/');
    }
  }
});

const handleSubmit = async () => {
  saving.value = true;
  try {
    if (isEdit.value) {
      await notesStore.updateNote(route.params.id, form.value);
    } else {
      await notesStore.createNote(form.value);
    }
    router.push('/');
  } catch (error) {
    console.error('Error saving note:', error);
    alert('Ошибка при сохранении заметки');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.note-edit-page {
  min-height: 100vh;
  padding: 20px 0;
}

.note-edit-card {
  max-width: 800px;
  margin: 0 auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.form-header h2 {
  margin: 0;
  font-size: 24px;
}

.note-form {
  margin-top: 20px;
}
</style>


