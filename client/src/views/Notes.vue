<template>
  <div class="notes-page">
    <div class="container">
      <header class="page-header">
        <h1>Мои заметки</h1>
        <div class="header-actions">
          <select v-model="sortBy" @change="handleSortChange" class="input" style="width: auto; margin-right: 10px;">
            <option value="updated_at">По дате изменения</option>
            <option value="created_at">По дате создания</option>
            <option value="title">По алфавиту</option>
          </select>
          <button @click="handleLogout" class="btn btn-secondary">Выйти</button>
        </div>
      </header>

      <div class="grid">
        <aside class="sidebar">
          <h3>Теги</h3>
          <ul class="sidebar-list">
            <li
              v-for="tag in tags"
              :key="tag.id"
              class="sidebar-item"
              :class="{ active: selectedTags.includes(tag.id) }"
              @click="toggleTag(tag.id)"
              :style="tag.color ? { borderLeft: `3px solid ${tag.color}` } : {}"
            >
              <span>{{ tag.name }} ({{ tag.note_count || 0 }})</span>
            </li>
          </ul>
          <button v-if="selectedTags.length > 0" @click="clearTagFilters" class="btn btn-secondary" style="width: 100%; margin-top: 10px;">
            Сбросить фильтры
          </button>
        </aside>

        <main class="notes-content">
          <div class="search-bar">
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Поиск заметок..."
              class="input"
            />
          </div>

          <div v-if="loading" class="loading">Загрузка...</div>
          
          <div v-else-if="filteredNotes.length === 0" class="empty-state">
            <p>Нет заметок. Создайте первую заметку!</p>
          </div>

          <div v-else class="notes-grid">
            <div
              v-for="note in filteredNotes"
              :key="note.id"
              class="note-card card"
              @click="$router.push(`/note/${note.id}`)"
            >
              <div class="note-header">
                <h3>{{ note.title || 'Без заголовка' }}</h3>
                <div class="note-actions">
                  <button
                    @click.stop="toggleFavorite(note.id)"
                    class="btn-icon"
                    :title="note.is_favorite ? 'Убрать из избранного' : 'Добавить в избранное'"
                  >
                    {{ note.is_favorite ? '★' : '☆' }}
                  </button>
                  <button
                    @click.stop="handleDelete(note.id)"
                    class="btn-icon"
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p class="note-preview">{{ truncate(note.content, 150) }}</p>
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
              <div class="note-meta">
                <small>{{ formatDate(note.updated_at) }}</small>
              </div>
            </div>
          </div>
        </main>
      </div>

      <button @click="$router.push('/note/new')" class="fab">+</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNotesStore } from '../stores/notes';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const notesStore = useNotesStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const sortBy = ref('updated_at');

const tags = computed(() => notesStore.tags);
const notes = computed(() => notesStore.notes);
const filteredNotes = computed(() => notesStore.filteredNotes);
const loading = computed(() => notesStore.loading);
const selectedTags = computed(() => notesStore.selectedTags);

onMounted(async () => {
  await notesStore.fetchNotes();
  await notesStore.fetchTags();
});

watch(searchQuery, (newVal) => {
  notesStore.setSearchQuery(newVal);
});

const handleSearch = async () => {
  await notesStore.fetchNotes();
};

const toggleTag = (tagId) => {
  notesStore.toggleTagFilter(tagId);
  notesStore.fetchNotes();
};

const clearTagFilters = () => {
  notesStore.selectedTags = [];
  notesStore.fetchNotes();
};

const handleSortChange = () => {
  notesStore.setSort(sortBy.value, 'DESC');
  notesStore.fetchNotes();
};

const toggleFavorite = async (id) => {
  await notesStore.toggleFavorite(id);
};

const handleDelete = async (id) => {
  if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
    await notesStore.deleteNote(id);
  }
};

const truncate = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
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

const handleLogout = () => {
  authStore.logout();
  // Clear notes data
  notesStore.notes = [];
  notesStore.tags = [];
  notesStore.clearFilters();
  // Redirect to login page - use window.location for guaranteed redirect
  window.location.href = '/login';
};
</script>

<style scoped>
.notes-page {
  min-height: 100vh;
  padding: 20px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
}

.notes-content {
  flex: 1;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.note-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.note-card:hover {
  transform: translateY(-2px);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.note-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex: 1;
}

.note-actions {
  display: flex;
  gap: 4px;
}

.note-preview {
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
  min-height: 60px;
}

.note-tags {
  margin-bottom: 8px;
}

.note-meta {
  color: #999;
  font-size: 12px;
  border-top: 1px solid #eee;
  padding-top: 8px;
}
</style>


