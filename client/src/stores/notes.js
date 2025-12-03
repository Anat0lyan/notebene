import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([]);
  const tags = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const selectedTags = ref([]);
  const sortBy = ref('updated_at');
  const sortOrder = ref('DESC');

  const filteredNotes = computed(() => {
    let result = [...notes.value];

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query)
      );
    }

    if (selectedTags.value.length > 0) {
      result = result.filter(note => {
        const noteTagIds = note.tags.map(t => t.id);
        return selectedTags.value.every(tagId => noteTagIds.includes(tagId));
      });
    }

    return result;
  });

  const fetchNotes = async () => {
    loading.value = true;
    try {
      const params = {
        sort: sortBy.value,
        order: sortOrder.value,
        archived: false
      };
      if (searchQuery.value) {
        params.search = searchQuery.value;
      }
      if (selectedTags.value.length > 0) {
        params.tags = selectedTags.value;
      }
      const response = await api.get('/notes', { params });
      notes.value = response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      loading.value = false;
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      tags.value = response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchNote = async (id) => {
    try {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  };

  const createNote = async (noteData) => {
    try {
      const response = await api.post('/notes', noteData);
      notes.value.unshift(response.data);
      await fetchTags();
      return response.data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      const response = await api.put(`/notes/${id}`, noteData);
      const index = notes.value.findIndex(n => n.id === id);
      if (index !== -1) {
        notes.value[index] = response.data;
      }
      await fetchTags();
      return response.data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const deleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      notes.value = notes.value.filter(n => n.id !== id);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const response = await api.patch(`/notes/${id}/favorite`);
      const index = notes.value.findIndex(n => n.id === id);
      if (index !== -1) {
        notes.value[index] = response.data;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleArchive = async (id) => {
    try {
      const response = await api.patch(`/notes/${id}/archive`);
      notes.value = notes.value.filter(n => n.id !== id);
      await fetchTags();
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  };

  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  const toggleTagFilter = (tagId) => {
    const index = selectedTags.value.indexOf(tagId);
    if (index === -1) {
      selectedTags.value.push(tagId);
    } else {
      selectedTags.value.splice(index, 1);
    }
  };

  const setSort = (sort, order) => {
    sortBy.value = sort;
    sortOrder.value = order;
  };

  const clearFilters = () => {
    searchQuery.value = '';
    selectedTags.value = [];
  };

  const clearAll = () => {
    notes.value = [];
    tags.value = [];
    searchQuery.value = '';
    selectedTags.value = [];
    loading.value = false;
  };

  const updateTag = async (id, tagData) => {
    try {
      const response = await api.put(`/tags/${id}`, tagData);
      const index = tags.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tags.value[index] = { ...tags.value[index], ...response.data };
      }
      
      // Update tags in notes as well
      notes.value.forEach(note => {
        const tagIndex = note.tags.findIndex(t => t.id === id);
        if (tagIndex !== -1) {
          note.tags[tagIndex] = { ...note.tags[tagIndex], ...response.data };
        }
      });
      
      await fetchTags(); // Refresh tags to get updated counts
      return response.data;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  };

  const deleteTag = async (id) => {
    try {
      await api.delete(`/tags/${id}`);
      tags.value = tags.value.filter(t => t.id !== id);
      
      // Remove tag from selected filters if it was selected
      const filterIndex = selectedTags.value.indexOf(id);
      if (filterIndex !== -1) {
        selectedTags.value.splice(filterIndex, 1);
      }
      
      // Remove tag from notes locally
      notes.value.forEach(note => {
        note.tags = note.tags.filter(t => t.id !== id);
      });
      
      await fetchNotes(); // Refresh notes to reflect tag removal
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  };

  return {
    notes,
    tags,
    loading,
    searchQuery,
    selectedTags,
    sortBy,
    sortOrder,
    filteredNotes,
    fetchNotes,
    fetchTags,
    fetchNote,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    toggleArchive,
    setSearchQuery,
    toggleTagFilter,
    setSort,
    clearFilters,
    clearAll,
    updateTag,
    deleteTag
  };
});


