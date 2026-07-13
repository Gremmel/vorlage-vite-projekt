<template>
  <main>
    <div class="mt-4 container">
      <div class="card p-4">
        <div class="row mb-3">
          <div class="col"><h2>Benutzerliste</h2></div>
          <div class="col-auto"><button type="button" @click="goToNewUser" class="btn btn-success">Neuer Benutzer</button></div>
        </div>

        <template v-if="isMobileView">
          <template v-for="user in userList" :key="user.username">
            <div class="card mb-1">
              <div class="card-header">
                <div class="row">
                  <div class="col">
                    <h5>{{ user.username }}</h5>
                  </div>
                  <div class="col">
                    <div class="d-flex justify-content-end">
                      <template v-if="user.username !== 'admin'">
                        <button @click="delUser(user.id, user.username)" type="button" class="btn btn-danger">
                          <i class="bi bi-trash"></i>
                        </button>
                        <button @click="editUser(user.id)" class="btn btn-primary ms-1">
                          <i class="bi bi-pencil"></i>
                        </button>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col">E-Mail:</div>
                  <div class="col">{{ user.email }}</div>
                </div>
                <div class="row">
                  <div class="col">aktiv:</div>
                  <div class="col">
                    <input
                      v-if="user.enabled === '1'"
                      type="checkbox"
                      :checked="user.enabled === '1'"
                      style="pointer-events: none"
                      class="form-check-input form-check-input-black"
                      readonly
                    />
                  </div>
                </div>
                <div class="row">
                  <div class="col">Rollen:</div>
                  <div class="col">
                    <ul class="list-group list-group-flush">
                      <li v-for="role in user.parsedRoles" :key="role">{{ role }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>

        <template v-else>
          <table class="table table">
            <thead>
              <tr>
                <th scope="col">Benutzername</th>
                <th scope="col">E-Mail</th>
                <th scope="col">Aktiv</th>
                <th scope="col">Rollen</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userList" :key="user.username">
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <input
                    v-if="user.enabled === '1'"
                    type="checkbox"
                    :checked="user.enabled === '1'"
                    style="pointer-events: none"
                    class="form-check-input form-check-input-black"
                    readonly
                  />
                </td>
                <td>
                  <ul class="list-group list-group-flush">
                    <li v-for="role in user.parsedRoles" :key="role">{{ role }}</li>
                  </ul>
                </td>
                <td>
                  <template v-if="user.username !== 'admin'">
                    <button @click="delUser(user.id, user.username)" type="button" class="btn btn-danger">
                      <i class="bi bi-trash"></i>
                    </button>
                    <button @click="editUser(user.id)" class="btn btn-primary ms-1">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </div>

    <div
      v-if="isModalVisible"
      class="modal fade show"
      style="display: block;"
      tabindex="-1"
      role="dialog"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Loeschen bestaetigen</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <p>Moechtest du diesen Benutzer <span class="fw-bold">{{ delUserName }}</span> wirklich loeschen?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Abbrechen</button>
            <button type="button" class="btn btn-danger" @click="deleteUser">Loeschen</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isModalVisible" class="modal-backdrop fade show"></div>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
const router = useRouter();
const userList = reactive([]);
const delUserName = ref('');
const delUserId = ref(0);
const isModalVisible = ref(false);
const isMobileView = ref(window.innerWidth <= 768);

async function getUserList() {
  try {
    const response = await fetch('/api/getUserList', {
      method: 'GET',
      credentials: 'include'
    });

    const result = await response.json();

    if (response.ok) {
      userList.splice(0);

      for (const user of result.users) {
        userList.push(user);
      }

      for (const user of userList) {
        if (user.roles) {
          try {
            user.parsedRoles = JSON.parse(user.roles);
          } catch (error) {
            console.error('Parsen der Rollen war nicht moeglich', error);
            user.parsedRoles = [];
          }
        } else {
          user.parsedRoles = [];
        }
      }
    } else if (response.status === 401) {
      await userStore.logout();
      userStore.setMessage('Session ist abgelaufen bitte neu Anmelden');
      router.push('/login');
    } else {
      console.log(result.message || 'keine Daten vorhanden');
    }
  } catch (error) {
    console.error('Es gab ein Problem mit dem Abrufen der getUserList:', error);
  }
}

onMounted(() => {
  getUserList();
});

const goToNewUser = () => {
  router.push('/newuser');
};

const delUser = (id, username) => {
  delUserName.value = username;
  delUserId.value = id;
  isModalVisible.value = true;
};

function editUser(id) {
  for (const user of userList) {
    if (user.id === id) {
      userStore.setEditUser(user);
    }
  }

  router.push('/edituser');
}

function closeModal() {
  isModalVisible.value = false;
}

async function deleteUser() {
  try {
    const response = await fetch('/api/delUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: delUserId.value }),
      credentials: 'include'
    });

    if (response.ok) {
      getUserList();
    } else {
      console.log('Es gab ein Problem mit dem Loeschen des Benutzers');
    }
  } catch (error) {
    console.error('Es gab ein Problem mit dem Loeschen des Benutzers:', error);
  }

  closeModal();
}
</script>

<style scoped>
.form-check-input-black {
  background-color: black;
  border-color: black;
}
</style>
