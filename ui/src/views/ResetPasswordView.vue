<template>
  <main class="container mt-4">
    <div class="card p-4 reset-card">
      <h2>Passwort zuruecksetzen</h2>

      <div v-if="!token" class="alert alert-danger">
        Es wurde kein gueltiger Reset-Token in der URL gefunden.
      </div>

      <template v-else>
        <div class="mb-3">
          <label for="password" class="form-label">Neues Passwort</label>
          <input id="password" v-model="password" class="form-control" type="password">
          <div class="form-text">Mindestens 8 Zeichen.</div>
        </div>

        <div class="mb-3">
          <label for="password2" class="form-label">Passwort wiederholen</label>
          <input id="password2" v-model="password2" class="form-control" type="password">
        </div>

        <div v-if="passwordMismatch" class="text-danger mb-2">
          Die Passwoerter stimmen nicht ueberein.
        </div>

        <div v-if="passwordTooShort" class="text-danger mb-2">
          Das Passwort muss mindestens 8 Zeichen lang sein.
        </div>

        <button class="btn btn-success" type="button" :disabled="disabledSubmit || isSubmitting" @click="submitReset">
          Passwort setzen
        </button>

        <div v-if="successMessage" class="alert alert-success mt-3 mb-0">
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0">
          {{ errorMessage }}
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

defineOptions({
  name: 'ResetPasswordView'
});

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const token = ref(String(route.query.token || ''));
const password = ref('');
const password2 = ref('');
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const passwordMismatch = computed(() => {
  return password.value !== '' && password2.value !== '' && password.value !== password2.value;
});

const passwordTooShort = computed(() => {
  return password.value !== '' && password.value.length < 8;
});

const disabledSubmit = computed(() => {
  return !token.value || password.value === '' || password2.value === '' || passwordMismatch.value || passwordTooShort.value;
});

async function submitReset() {
  isSubmitting.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    const response = await fetch('/api/confirmPasswordReset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token.value,
        password: password.value
      })
    });

    const result = await response.json();

    if (response.ok) {
      successMessage.value = result.message || 'Passwort wurde erfolgreich gesetzt.';
      userStore.setMessage('Passwort erfolgreich geaendert. Bitte anmelden.');
      router.push('/login');
    } else {
      errorMessage.value = result.message || 'Token ungueltig oder abgelaufen.';
    }
  } catch (error) {
    errorMessage.value = `Es gab ein Problem beim Zuruecksetzen: ${error}`;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.reset-card {
  max-width: 36rem;
}
</style>
