<template>
  <div class="note-detail-page">
    <div class="container">
      <div v-if="loading" class="loading">Загрузка...</div>
      
      <div v-else-if="note" class="note-detail">
        <div class="note-actions-bar">
          <button @click="$router.back()" class="btn btn-secondary">← Назад</button>
          <div>
            <button @click="handleToggleFavorite" class="btn btn-secondary">
              {{ note.is_favorite ? '★ Избранное' : '☆ В избранное' }}
            </button>
            <button @click="$router.push(`/note/${note.id}/edit`)" class="btn btn-primary">
              Редактировать
            </button>
            <button @click="handleDelete" class="btn btn-danger">Удалить</button>
          </div>
        </div>

        <article class="note-content card">
          <h1>{{ note.title || 'Без заголовка' }}</h1>
          
          <div class="note-meta-info">
            <div class="note-tags">
              <span
                v-for="tag in note.tags"
                :key="tag.id"
                class="tag"
                :style="tag.color ? { backgroundColor: tag.color, color: 'white' } : {}"
              >
                {{ tag.name }}
              </span>
            </div>
            <div class="note-dates">
              <small>Создано: {{ formatDate(note.created_at) }}</small>
              <small>Изменено: {{ formatDate(note.updated_at) }}</small>
            </div>
          </div>

          <div class="note-body">
            <pre>{{ note.content || 'Нет содержимого' }}</pre>
          </div>
        </article>
      </div>
      
      <div v-else class="error">Заметка не найдена</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '../stores/notes';

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();

const note = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    note.value = await notesStore.fetchNote(route.params.id);
  } catch (error) {
    console.error('Error loading note:', error);
  } finally {
    loading.value = false;
  }
});

const handleToggleFavorite = async () => {
  await notesStore.toggleFavorite(note.value.id);
  note.value = await notesStore.fetchNote(route.params.id);
};

const handleDelete = async () => {
  if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
    await notesStore.deleteNote(note.value.id);
    router.push('/');
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
.note-detail-page {
  min-height: 100vh;
  padding: 20px 0;
}

.note-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.note-actions-bar > div {
  display: flex;
  gap: 10px;
}

.note-content {
  max-width: 800px;
  margin: 0 auto;
}

.note-content h1 {
  font-size: 32px;
  margin-bottom: 20px;
  color: #333;
}

.note-meta-info {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.note-tags {
  margin-bottom: 12px;
}

.note-dates {
  display: flex;
  gap: 20px;
  color: #999;
  font-size: 14px;
}

.note-body {
  margin-top: 30px;
}

.note-body pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  color: #333;
  font-family: inherit;
  font-size: 16px;
}
</style>


