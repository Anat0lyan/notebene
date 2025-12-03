<template>
  <div class="tag-input-container">
    <div class="tag-input">
      <span
        v-for="(tag, index) in modelValue"
        :key="index"
        class="tag"
      >
        {{ tag }}
        <button
          type="button"
          @click="removeTag(index)"
          class="tag-remove"
        >
          ×
        </button>
      </span>
      <input
        v-model="inputValue"
        type="text"
        @keydown.enter.prevent="addTag"
        @keydown.comma.prevent="addTag"
        @blur="addTag"
        placeholder="Добавить тег..."
        class="tag-input-field"
      />
    </div>
    <div v-if="filteredSuggestions.length > 0 && inputValue" class="tag-suggestions">
      <div
        v-for="suggestion in filteredSuggestions"
        :key="suggestion"
        @click="selectSuggestion(suggestion)"
        class="suggestion-item"
      >
        {{ suggestion }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  suggestions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const inputValue = ref('');

const filteredSuggestions = computed(() => {
  if (!inputValue.value) return [];
  const lowerInput = inputValue.value.toLowerCase();
  return props.suggestions.filter(
    s => s.toLowerCase().includes(lowerInput) && !props.modelValue.includes(s)
  );
});

const addTag = () => {
  const tag = inputValue.value.trim();
  if (tag && !props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag]);
    inputValue.value = '';
  }
};

const removeTag = (index) => {
  const newTags = [...props.modelValue];
  newTags.splice(index, 1);
  emit('update:modelValue', newTags);
};

const selectSuggestion = (suggestion) => {
  if (!props.modelValue.includes(suggestion)) {
    emit('update:modelValue', [...props.modelValue, suggestion]);
    inputValue.value = '';
  }
};

watch(() => props.modelValue, () => {
  // Clear input if tag was added
  if (!inputValue.value.trim()) return;
});
</script>

<style scoped>
.tag-input-container {
  position: relative;
}

.tag-input {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-height: 44px;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background-color: #e0e0e0;
  border-radius: 16px;
  font-size: 12px;
  gap: 6px;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #666;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  color: #f44336;
}

.tag-input-field {
  border: none;
  outline: none;
  flex: 1;
  min-width: 120px;
  padding: 4px;
  font-size: 14px;
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}
</style>


