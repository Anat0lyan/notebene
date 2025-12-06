import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from './auth';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([]);
  const tags = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const selectedTags = ref([]);
  const sortBy = ref('updated_at');
  const sortOrder = ref('desc');

  const authStore = useAuthStore();

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
        const noteTagIds = note.tags?.map(t => t.id) || [];
        return selectedTags.value.every(tagId => noteTagIds.includes(tagId));
      });
    }

    return result;
  });

  const fetchNotes = async () => {
    if (!authStore.user) return;
    
    loading.value = true;
    try {
      const notesRef = collection(db, 'notes');
      const q = query(
        notesRef,
        where('userId', '==', authStore.user.id),
        where('isArchived', '==', false),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const notesData = [];
      
      for (const docSnap of snapshot.docs) {
        const noteData = { id: docSnap.id, ...docSnap.data() };
        
        // Convert Firestore timestamps to JavaScript dates
        if (noteData.createdAt) {
          noteData.created_at = noteData.createdAt.toDate ? noteData.createdAt.toDate().toISOString() : noteData.createdAt;
        }
        if (noteData.updatedAt) {
          noteData.updated_at = noteData.updatedAt.toDate ? noteData.updatedAt.toDate().toISOString() : noteData.updatedAt;
        }
        
        // Fetch tags for this note
        const tagsRef = collection(db, 'notes', docSnap.id, 'tags');
        const tagsSnapshot = await getDocs(tagsRef);
        noteData.tags = tagsSnapshot.docs.map(tagDoc => ({
          id: tagDoc.id,
          ...tagDoc.data()
        }));
        
        notesData.push(noteData);
      }
      
      // Client-side sorting
      notesData.sort((a, b) => {
        let aVal, bVal;
        const order = sortOrder.value.toLowerCase() === 'asc' ? 1 : -1;
        
        if (sortBy.value === 'title') {
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          return aVal.localeCompare(bVal) * order;
        } else if (sortBy.value === 'created_at') {
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
        } else {
          aVal = new Date(a.updated_at || 0).getTime();
          bVal = new Date(b.updated_at || 0).getTime();
        }
        
        return (aVal - bVal) * order;
      });
      
      notes.value = notesData;
      await fetchTags();
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      loading.value = false;
    }
  };

  const fetchTags = async () => {
    if (!authStore.user) return;
    
    try {
      const tagsRef = collection(db, 'tags');
      const q = query(
        tagsRef,
        where('userId', '==', authStore.user.id),
        orderBy('name')
      );
      
      const snapshot = await getDocs(q);
      const tagsData = [];
      
      for (const tagDoc of snapshot.docs) {
        const tagData = { id: tagDoc.id, ...tagDoc.data() };
        
        // Count notes with this tag
        const notesRef = collection(db, 'notes');
        const notesQuery = query(
          notesRef,
          where('userId', '==', authStore.user.id),
          where('isArchived', '==', false)
        );
        const notesSnapshot = await getDocs(notesQuery);
        let noteCount = 0;
        
        for (const noteDoc of notesSnapshot.docs) {
          const noteTagsRef = collection(db, 'notes', noteDoc.id, 'tags');
          const noteTagsSnapshot = await getDocs(noteTagsRef);
          const hasTag = noteTagsSnapshot.docs.some(tag => tag.id === tagDoc.id);
          if (hasTag) noteCount++;
        }
        
        tagData.note_count = noteCount;
        tagsData.push(tagData);
      }
      
      tags.value = tagsData;
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchNote = async (id) => {
    if (!authStore.user) return null;
    
    try {
      const noteRef = doc(db, 'notes', id);
      const noteSnap = await getDoc(noteRef);
      
      if (!noteSnap.exists() || noteSnap.data().userId !== authStore.user.id) {
        throw new Error('Note not found');
      }
      
      const noteData = { id: noteSnap.id, ...noteSnap.data() };
      
      // Convert timestamps
      if (noteData.createdAt) {
        noteData.created_at = noteData.createdAt.toDate ? noteData.createdAt.toDate().toISOString() : noteData.createdAt;
      }
      if (noteData.updatedAt) {
        noteData.updated_at = noteData.updatedAt.toDate ? noteData.updatedAt.toDate().toISOString() : noteData.updatedAt;
      }
      
      // Fetch tags
      const tagsRef = collection(db, 'notes', id, 'tags');
      const tagsSnapshot = await getDocs(tagsRef);
      noteData.tags = tagsSnapshot.docs.map(tagDoc => ({
        id: tagDoc.id,
        ...tagDoc.data()
      }));
      
      return noteData;
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  };

  const createNote = async (noteData) => {
    if (!authStore.user) throw new Error('Not authenticated');
    
    try {
      const notesRef = collection(db, 'notes');
      const newNote = {
        userId: authStore.user.id,
        title: noteData.title || '',
        content: noteData.content || '',
        isArchived: false,
        isFavorite: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(notesRef, newNote);
      
      // Handle tags
      if (noteData.tags && noteData.tags.length > 0) {
        await updateNoteTags(docRef.id, noteData.tags);
      }
      
      await fetchNotes();
      return await fetchNote(docRef.id);
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  const updateNote = async (id, noteData) => {
    if (!authStore.user) throw new Error('Not authenticated');
    
    try {
      const noteRef = doc(db, 'notes', id);
      const noteSnap = await getDoc(noteRef);
      
      if (!noteSnap.exists() || noteSnap.data().userId !== authStore.user.id) {
        throw new Error('Note not found');
      }
      
      await updateDoc(noteRef, {
        title: noteData.title,
        content: noteData.content,
        updatedAt: serverTimestamp()
      });
      
      // Update tags
      if (noteData.tags !== undefined) {
        await updateNoteTags(id, noteData.tags);
      }
      
      await fetchNotes();
      return await fetchNote(id);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const updateNoteTags = async (noteId, tagNames) => {
    if (!authStore.user) return;
    
    // Clear existing tags
    const tagsRef = collection(db, 'notes', noteId, 'tags');
    const existingTagsSnapshot = await getDocs(tagsRef);
    for (const tagDoc of existingTagsSnapshot.docs) {
      await deleteDoc(doc(db, 'notes', noteId, 'tags', tagDoc.id));
    }
    
    // Add new tags
    for (const tagName of tagNames) {
      if (!tagName.trim()) continue;
      
      // Find or create tag
      let tag = tags.value.find(t => t.name === tagName.trim());
      if (!tag) {
        // Create new tag
        const tagsRef = collection(db, 'tags');
        const newTag = {
          userId: authStore.user.id,
          name: tagName.trim(),
          color: null,
          createdAt: serverTimestamp()
        };
        const tagDocRef = await addDoc(tagsRef, newTag);
        tag = { id: tagDocRef.id, ...newTag };
        tags.value.push(tag);
      }
      
      // Add tag to note
      await addDoc(tagsRef, {
        tagId: tag.id,
        name: tag.name,
        color: tag.color
      });
    }
  };

  const deleteNote = async (id) => {
    if (!authStore.user) throw new Error('Not authenticated');
    
    try {
      const noteRef = doc(db, 'notes', id);
      const noteSnap = await getDoc(noteRef);
      
      if (!noteSnap.exists() || noteSnap.data().userId !== authStore.user.id) {
        throw new Error('Note not found');
      }
      
      // Delete tags subcollection
      const tagsRef = collection(db, 'notes', id, 'tags');
      const tagsSnapshot = await getDocs(tagsRef);
      for (const tagDoc of tagsSnapshot.docs) {
        await deleteDoc(doc(db, 'notes', id, 'tags', tagDoc.id));
      }
      
      await deleteDoc(noteRef);
      notes.value = notes.value.filter(n => n.id !== id);
      await fetchTags();
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  const toggleFavorite = async (id) => {
    if (!authStore.user) return;
    
    try {
      const noteRef = doc(db, 'notes', id);
      const noteSnap = await getDoc(noteRef);
      
      if (!noteSnap.exists() || noteSnap.data().userId !== authStore.user.id) {
        throw new Error('Note not found');
      }
      
      await updateDoc(noteRef, {
        isFavorite: !noteSnap.data().isFavorite,
        updatedAt: serverTimestamp()
      });
      
      await fetchNotes();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleArchive = async (id) => {
    if (!authStore.user) return;
    
    try {
      const noteRef = doc(db, 'notes', id);
      const noteSnap = await getDoc(noteRef);
      
      if (!noteSnap.exists() || noteSnap.data().userId !== authStore.user.id) {
        throw new Error('Note not found');
      }
      
      await updateDoc(noteRef, {
        isArchived: !noteSnap.data().isArchived,
        updatedAt: serverTimestamp()
      });
      
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
    sortOrder.value = order.toLowerCase();
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
    if (!authStore.user) throw new Error('Not authenticated');
    
    try {
      const tagRef = doc(db, 'tags', id);
      const tagSnap = await getDoc(tagRef);
      
      if (!tagSnap.exists() || tagSnap.data().userId !== authStore.user.id) {
        throw new Error('Tag not found');
      }
      
      const updateData = {};
      if (tagData.name !== undefined) updateData.name = tagData.name;
      if (tagData.color !== undefined) updateData.color = tagData.color;
      
      await updateDoc(tagRef, updateData);
      
      // Update tag in all notes
      const notesRef = collection(db, 'notes');
      const notesQuery = query(
        notesRef,
        where('userId', '==', authStore.user.id)
      );
      const notesSnapshot = await getDocs(notesQuery);
      
      for (const noteDoc of notesSnapshot.docs) {
        const noteTagsRef = collection(db, 'notes', noteDoc.id, 'tags');
        const noteTagsQuery = query(noteTagsRef, where('tagId', '==', id));
        const noteTagsSnapshot = await getDocs(noteTagsQuery);
        
        for (const noteTagDoc of noteTagsSnapshot.docs) {
          await updateDoc(doc(db, 'notes', noteDoc.id, 'tags', noteTagDoc.id), {
            name: tagData.name !== undefined ? tagData.name : noteTagDoc.data().name,
            color: tagData.color !== undefined ? tagData.color : noteTagDoc.data().color
          });
        }
      }
      
      await fetchTags();
      await fetchNotes();
      
      const updatedTag = { id, ...tagSnap.data(), ...updateData };
      return updatedTag;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  };

  const deleteTag = async (id) => {
    if (!authStore.user) throw new Error('Not authenticated');
    
    try {
      const tagRef = doc(db, 'tags', id);
      const tagSnap = await getDoc(tagRef);
      
      if (!tagSnap.exists() || tagSnap.data().userId !== authStore.user.id) {
        throw new Error('Tag not found');
      }
      
      // Remove tag from all notes
      const notesRef = collection(db, 'notes');
      const notesQuery = query(
        notesRef,
        where('userId', '==', authStore.user.id)
      );
      const notesSnapshot = await getDocs(notesQuery);
      
      for (const noteDoc of notesSnapshot.docs) {
        const noteTagsRef = collection(db, 'notes', noteDoc.id, 'tags');
        const noteTagsQuery = query(noteTagsRef, where('tagId', '==', id));
        const noteTagsSnapshot = await getDocs(noteTagsQuery);
        
        for (const noteTagDoc of noteTagsSnapshot.docs) {
          await deleteDoc(doc(db, 'notes', noteDoc.id, 'tags', noteTagDoc.id));
        }
      }
      
      // Delete tag
      await deleteDoc(tagRef);
      
      tags.value = tags.value.filter(t => t.id !== id);
      const filterIndex = selectedTags.value.indexOf(id);
      if (filterIndex !== -1) {
        selectedTags.value.splice(filterIndex, 1);
      }
      
      notes.value.forEach(note => {
        note.tags = note.tags.filter(t => t.id !== id);
      });
      
      await fetchNotes();
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
