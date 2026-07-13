<template>
  <main class="container mt-4">
    <div class="card p-4 forgot-card">
      <h2>Passwort vergessen</h2>
      <p class="text-muted">
        Gib deinen Benutzernamen oder deine E-Mail-Adresse ein.
      </p>

      <div class="mb-3">
        <label for="identifier" class="form-label">Benutzername oder E-Mail</label>
        <input
          id="identifier"
          v-model="identifier"
          class="form-control"
          type="text"
          placeholder="z. B. max.mustermann"
        >
      </div>

      <button class="btn btn-primary" type="button" :disabled="isSubmitting || !identifier.trim()" @click="requestReset">
        Reset-Link anfordern
      </button>

      <div v-if="infoMessage" class="alert alert-info mt-3 mb-0">
        {{ infoMessage }}
      </div>

      <div v-if="errorMessage" class="alert alert-danger mt-3 mb-0">
        {{ errorMessage }}
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';

defineOptions({
  name: 'ForgotPasswordView'
});

const identifier = ref('');
const isSubmitting = ref(false);
const infoMessage = ref('');
const errorMessage = ref('');

async function requestReset() {
  isSubmitting.value = true;
  infoMessage.value = '';
  errorMessage.value = '';

  try {
    const response = await fetch('/api/requestPasswordReset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: identifier.value.trim()
      })
    });

    const result = await response.json();

    if (response.ok) {
      infoMessage.value = result.message || 'Falls ein passender Benutzer existiert, wurde eine E-Mail zum Zuruecksetzen versendet.';
    } else {
      errorMessage.value = result.message || 'Anfrage konnte nicht verarbeitet werden.';
    }
  } catch (error) {
    errorMessage.value = `Es gab ein Problem bei der Anfrage: ${error}`;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.forgot-card {
  max-width: 36rem;
}
</style>
