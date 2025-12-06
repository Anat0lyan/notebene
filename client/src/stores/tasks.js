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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from './auth';

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([]);
  const stats = ref({
    total: 0,
    completed: 0,
    due_today: 0,
    overdue: 0,
    upcoming: 0
  });
  const loading = ref(false);
  const filter = ref('all');
  const sortBy = ref('due_date');
  const sortOrder = ref('asc');

  const authStore = useAuthStore();

  const filteredTasks = computed(() => {
    let result = [...tasks.value];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filter.value === 'today') {
      result = result.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        const dueDate = task.dueDate instanceof Timestamp 
          ? task.dueDate.toDate() 
          : new Date(task.dueDate);
        const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        return taskDate.getTime() === today.getTime();
      });
    } else if (filter.value === 'upcoming') {
      result = result.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        const dueDate = task.dueDate instanceof Timestamp 
          ? task.dueDate.toDate() 
          : new Date(task.dueDate);
        return dueDate > now;
      });
    } else if (filter.value === 'overdue') {
      result = result.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        const dueDate = task.dueDate instanceof Timestamp 
          ? task.dueDate.toDate() 
          : new Date(task.dueDate);
        return dueDate < now;
      });
    } else if (filter.value === 'completed') {
      result = result.filter(task => task.completed);
    } else if (filter.value === 'pending') {
      result = result.filter(task => !task.completed);
    }
    
    return result;
  });

  const fetchTasks = async (filterParam = null, sortParam = null, orderParam = null) => {
    if (!authStore.user) return;
    
    loading.value = true;
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', authStore.user.id)
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
        if (taskData.reminder) {
          taskData.reminder = taskData.reminder.toDate ? taskData.reminder.toDate().toISOString() : taskData.reminder;
        }
        
        // Get note title if noteId exists
        if (taskData.noteId) {
          try {
            const noteRef = doc(db, 'notes', taskData.noteId);
            const noteSnap = await getDoc(noteRef);
            if (noteSnap.exists()) {
              taskData.note_title = noteSnap.data().title;
            }
          } catch (error) {
            console.error('Error fetching note title:', error);
          }
        }
        
        tasksData.push(taskData);
      }
      
      // Sort tasks
      const sortField = sortParam || sortBy.value;
      const order = (orderParam || sortOrder.value).toLowerCase();
      
      tasksData.sort((a, b) => {
        let aVal, bVal;
        
        if (sortField === 'priority') {
          const priorityOrder = { high: 1, medium: 2, low: 3 };
          aVal = priorityOrder[a.priority] || 2;
          bVal = priorityOrder[b.priority] || 2;
        } else if (sortField === 'due_date') {
          aVal = a.dueDate ? (a.dueDate instanceof Timestamp ? a.dueDate.toMillis() : new Date(a.dueDate).getTime()) : 0;
          bVal = b.dueDate ? (b.dueDate instanceof Timestamp ? b.dueDate.toMillis() : new Date(b.dueDate).getTime()) : 0;
        } else if (sortField === 'created_at') {
          aVal = a.createdAt ? (a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : 0;
          bVal = b.createdAt ? (b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : 0;
        } else {
          aVal = a[sortField] || '';
          bVal = b[sortField] || '';
        }
        
        if (order === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
      
      tasks.value = tasksData;
      filter.value = filterParam || filter.value;
      await fetchStats();
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      loading.value = false;
    }
  };

  const fetchStats = async () => {
    if (!authStore.user) return;
    
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('userId', '==', authStore.user.id)
      );
      
      const snapshot = await getDocs(q);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let total = 0;
      let completed = 0;
      let dueToday = 0;
      let overdue = 0;
      let upcoming = 0;
      
      snapshot.docs.forEach(docSnap => {
        const task = docSnap.data();
        total++;
        
        if (task.completed) {
          completed++;
        } else if (task.dueDate) {
          const dueDate = task.dueDate instanceof Timestamp 
            ? task.dueDate.toDate() 
            : new Date(task.dueDate);
          const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          
          if (taskDate.getTime() === today.getTime()) {
            dueToday++;
          } else if (dueDate < now) {
            overdue++;
          } else if (dueDate > now) {
            upcoming++;
          }
        }
      });
      
      stats.value = {
        total,
        completed,
        due_today: dueToday,
        overdue,
        upcoming
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTask = async (id) => {
    if (!authStore.user) return null;
    
    try {
      const taskRef = doc(db, 'tasks', id);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists() || taskSnap.data().userId !== authStore.user.id) {
        throw new Error('Task not found');
      }
      
      const taskData = { id: taskSnap.id, ...taskSnap.data() };
      
      // Convert timestamps
      if (taskData.createdAt) {
        taskData.created_at = taskData.createdAt.toDate ? taskData.createdAt.toDate().toISOString() : taskData.createdAt;
      }
      if (taskData.updatedAt) {
        taskData.updated_at = taskData.updatedAt.toDate ? taskData.updatedAt.toDate().toISOString() : taskData.updatedAt;
      }
      if (taskData.dueDate) {
        taskData.due_date = taskData.dueDate.toDate ? taskData.dueDate.toDate().toISOString() : taskData.dueDate;
      }
      if (taskData.reminder) {
        taskData.reminder = taskData.reminder.toDate ? taskData.reminder.toDate().toISOString() : taskData.reminder;
      }
      
      // Get note title if noteId exists
      if (taskData.noteId) {
        try {
          const noteRef = doc(db, 'notes', taskData.noteId);
          const noteSnap = await getDoc(noteRef);
          if (noteSnap.exists()) {
            taskData.note_title = noteSnap.data().title;
          }
        } catch (error) {
          console.error('Error fetching note title:', error);
        }
      }
      
      return taskData;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  };

  const createTask = async (taskData) => {
    if (!authStore.user) throw new Error('Not authenticated');
    
    try {
      const tasksRef = collection(db, 'tasks');
      
      // Validate note belongs to user if provided
      if (taskData.noteId) {
        const noteRef = doc(db, 'notes', taskData.noteId);
        const noteSnap = await getDoc(noteRef);
        if (!noteSnap.exists() || noteSnap.data().userId !== authStore.user.id) {
          throw new Error('Note not found');
        }
      }
      
      const newTask = {
        userId: authStore.user.id,
        title: taskData.title,
        description: taskData.description || null,
        dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
        priority: taskData.priority || 'medium',
        noteId: taskData.noteId || null,
        completed: false,
        recurringType: taskData.recurringType || 'none',
        recurringInterval: taskData.recurringInterval || 1,
        reminder: taskData.reminder ? Timestamp.fromDate(new Date(taskData.reminder)) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(tasksRef, newTask);
      await fetchTasks();
      return await fetchTask(docRef.id);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (id, taskData) => {
    if (!authStore.user) throw new Error('Not authenticated');
    
    try {
      const taskRef = doc(db, 'tasks', id);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists() || taskSnap.data().userId !== authStore.user.id) {
        throw new Error('Task not found');
      }
      
      // Validate note if provided
      if (taskData.noteId !== undefined) {
        if (taskData.noteId) {
          const noteRef = doc(db, 'notes', taskData.noteId);
          const noteSnap = await getDoc(noteRef);
          if (!noteSnap.exists() || noteSnap.data().userId !== authStore.user.id) {
            throw new Error('Note not found');
          }
        }
      }
      
      const updateData = {
        updatedAt: serverTimestamp()
      };
      
      if (taskData.title !== undefined) updateData.title = taskData.title;
      if (taskData.description !== undefined) updateData.description = taskData.description;
      if (taskData.dueDate !== undefined) {
        updateData.dueDate = taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null;
      }
      if (taskData.priority !== undefined) updateData.priority = taskData.priority;
      if (taskData.noteId !== undefined) updateData.noteId = taskData.noteId;
      if (taskData.recurringType !== undefined) updateData.recurringType = taskData.recurringType;
      if (taskData.recurringInterval !== undefined) updateData.recurringInterval = taskData.recurringInterval;
      if (taskData.reminder !== undefined) {
        updateData.reminder = taskData.reminder ? Timestamp.fromDate(new Date(taskData.reminder)) : null;
      }
      
      await updateDoc(taskRef, updateData);
      await fetchTasks();
      return await fetchTask(id);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id) => {
    if (!authStore.user) throw new Error('Not authenticated');
    
    try {
      const taskRef = doc(db, 'tasks', id);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists() || taskSnap.data().userId !== authStore.user.id) {
        throw new Error('Task not found');
      }
      
      await deleteDoc(taskRef);
      tasks.value = tasks.value.filter(t => t.id !== id);
      await fetchStats();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const toggleTask = async (id) => {
    if (!authStore.user) return;
    
    try {
      const taskRef = doc(db, 'tasks', id);
      const taskSnap = await getDoc(taskRef);
      
      if (!taskSnap.exists() || taskSnap.data().userId !== authStore.user.id) {
        throw new Error('Task not found');
      }
      
      await updateDoc(taskRef, {
        completed: !taskSnap.data().completed,
        updatedAt: serverTimestamp()
      });
      
      await fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const setFilter = (newFilter) => {
    filter.value = newFilter;
  };

  const setSort = (sort, order) => {
    sortBy.value = sort;
    sortOrder.value = order.toLowerCase();
  };

  const clearAll = () => {
    tasks.value = [];
    stats.value = { total: 0, completed: 0, due_today: 0, overdue: 0, upcoming: 0 };
    loading.value = false;
    filter.value = 'all';
  };

  return {
    tasks,
    stats,
    loading,
    filter,
    sortBy,
    sortOrder,
    filteredTasks,
    fetchTasks,
    fetchStats,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    setFilter,
    setSort,
    clearAll
  };
});
