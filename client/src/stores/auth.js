import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(false);

  // Initialize auth state listener
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      user.value = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        username: firebaseUser.email?.split('@')[0] || firebaseUser.uid
      };
    } else {
      user.value = null;
    }
  });

  const login = async (email, password) => {
    try {
      loading.value = true;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      let errorMessage = 'Ошибка входа';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Пользователь не найден';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Неверный пароль';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Неверный email';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Слишком много попыток. Попробуйте позже';
      }
      return { success: false, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const register = async (email, password) => {
    try {
      loading.value = true;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      let errorMessage = 'Ошибка регистрации';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email уже используется';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Неверный email';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Пароль слишком слабый';
      }
      return { success: false, error: errorMessage };
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      user.value = null;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return {
    user,
    loading,
    login,
    register,
    logout
  };
});
