<template>
  <li
    class="sidebar-item"
    :class="{ active: isSelected }"
    :style="tag.color ? { borderLeft: `3px solid ${tag.color}` } : {}"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <span 
      v-if="!isEditing" 
      class="tag-name" 
      @click="handleClick"
      v-html="highlightedTagName"
    ></span>
    
    <div v-else class="tag-edit-form">
      <input
        v-model="editName"
        @keydown.enter="handleSave"
        @keydown.esc="handleCancel"
        @blur="handleSave"
        class="tag-edit-input"
        ref="editInputRef"
        type="text"
      />
    </div>
    
    <div v-if="showActions && !isEditing" class="tag-actions">
      <button
        @click.stop="handleEdit"
        class="tag-action-btn"
        title="Редактировать"
      >
        ✏️
      </button>
      <button
        @click.stop="handleDelete"
        class="tag-action-btn tag-delete-btn"
        title="Удалить"
      >
        🗑️
      </button>
    </div>
  </li>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useNotesStore } from '../stores/notes';

const props = defineProps({
  tag: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['click', 'updated', 'deleted']);

const notesStore = useNotesStore();
const showActions = ref(false);
const isEditing = ref(false);
const editName = ref('');
const editInputRef = ref(null);

const handleClick = () => {
  if (!isEditing.value) {
    emit('click', props.tag.id);
  }
};

const handleEdit = async (e) => {
  e.stopPropagation();
  isEditing.value = true;
  editName.value = props.tag.name;
  await nextTick();
  editInputRef.value?.focus();
  editInputRef.value?.select();
};

const handleSave = async () => {
  if (!isEditing.value) return;
  
  const newName = editName.value.trim();
  
  if (!newName) {
    // If name is empty, cancel edit
    editName.value = props.tag.name;
    isEditing.value = false;
    return;
  }
  
  if (newName !== props.tag.name) {
    try {
      await notesStore.updateTag(props.tag.id, { name: newName });
      emit('updated');
    } catch (error) {
      console.error('Error updating tag:', error);
      alert(error.response?.data?.error || 'Ошибка при обновлении тега');
      editName.value = props.tag.name;
    }
  }
  
  isEditing.value = false;
};

const handleCancel = () => {
  editName.value = props.tag.name;
  isEditing.value = false;
};

const handleDelete = async (e) => {
  e.stopPropagation();
  
  if (!confirm(`Вы уверены, что хотите удалить тег "${props.tag.name}"?`)) {
    return;
  }
  
  try {
    await notesStore.deleteTag(props.tag.id);
    emit('deleted');
  } catch (error) {
    console.error('Error deleting tag:', error);
    alert(error.response?.data?.error || 'Ошибка при удалении тега');
  }
};

// Helper function to escape HTML
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const highlightedTagName = computed(() => {
  const tagName = props.tag.name;
  const count = props.tag.note_count || 0;
  
  if (!props.searchQuery || !props.searchQuery.trim()) {
    return `${escapeHtml(tagName)} <span class="tag-count">(${count})</span>`;
  }
  
  const query = props.searchQuery.trim();
  const escapedQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const escapedTagName = escapeHtml(tagName);
  const highlightedName = escapedTagName.replace(regex, '<mark>$1</mark>');
  
  return `${highlightedName} <span class="tag-count">(${count})</span>`;
});
</script>

<style scoped>
.sidebar-item {
  position: relative;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-item:hover {
  background-color: #f5f5f5;
}

.sidebar-item.active {
  background-color: #e8f5e9;
  font-weight: 500;
}

.tag-name {
  flex: 1;
  cursor: pointer;
}

.tag-edit-form {
  flex: 1;
  display: flex;
}

.tag-edit-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #4CAF50;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.tag-edit-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.tag-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.sidebar-item:hover .tag-actions {
  opacity: 1;
}

.tag-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-action-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.tag-delete-btn:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

.tag-count {
  color: #999;
  font-weight: normal;
}

.tag-name mark {
  background-color: #ffeb3b;
  color: #333;
  padding: 2px 0;
  border-radius: 2px;
  font-weight: 600;
}
</style>

