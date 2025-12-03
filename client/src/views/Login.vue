<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Notabene</h1>
      <p class="subtitle">Система управления заметками</p>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            placeholder="Имя пользователя"
            class="input"
            required
          />
        </div>
        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Пароль"
            class="input"
            required
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ isRegister ? 'Зарегистрироваться' : 'Войти' }}
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="isRegister = !isRegister"
          :disabled="loading"
        >
          {{ isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться' }}
        </button>
      </form>
      
      <div class="demo-info">
        <p>Для тестирования используйте:</p>
        <p><strong>Логин:</strong> admin</p>
        <p><strong>Пароль:</strong> admin</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const isRegister = ref(false);
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    const result = isRegister.value
      ? await authStore.register(username.value, password.value)
      : await authStore.login(username.value, password.value);
    
    if (result.success) {
      router.push('/');
    } else {
      error.value = result.error;
    }
  } catch (err) {
    error.value = 'Произошла ошибка';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-card h1 {
  text-align: center;
  margin-bottom: 8px;
  color: #333;
  font-size: 32px;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.error-message {
  color: #f44336;
  margin-bottom: 16px;
  text-align: center;
  font-size: 14px;
}

.btn {
  width: 100%;
  margin-bottom: 10px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-info {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.demo-info p {
  margin: 4px 0;
}
</style>


