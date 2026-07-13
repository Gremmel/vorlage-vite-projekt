<template>
  <main class="container mt-4">
    <div class="card p-4">
      <h2>Benutzerverwaltung</h2>
      <p class="text-muted mb-4">
        Diese Vorlage enthaelt nur noch Login, Session-Verwaltung und Benutzerverwaltung.
      </p>

      <div v-if="!userActive" class="alert alert-warning" role="alert">
        Dein Benutzerkonto ist derzeit nicht aktiv.
      </div>

      <div v-else class="d-flex gap-2 flex-wrap">
        <button v-if="isAdmin" class="btn btn-primary" @click="router.push('/users')">
          Benutzerliste
        </button>
        <button v-if="isAdmin" class="btn btn-success" @click="router.push('/newuser')">
          Neuer Benutzer
        </button>
        <button class="btn btn-outline-secondary" @click="router.push('/changePassword')">
          Passwort aendern
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const router = useRouter();
const userStore = useUserStore();

const isAdmin = computed(() => userStore.hasRole('admin'));
const userActive = computed(() => userStore.isEnabled);
</script>

<style scoped>
.card {
  max-width: 60rem;
}
</style>
