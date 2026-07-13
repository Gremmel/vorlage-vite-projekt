import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import UserView from "../views/UserView.vue";
import NewUserView from "../views/NewUserView.vue";
import EditUserView from "../views/EditUserView.vue";
import LoginView from "../views/LoginView.vue";
import { useUserStore } from "@/stores/userStore";
import ChangePassword from "@/views/ChangePassword.vue";
import Impressum from "@/views/Impressum.vue";
import DSGVO from "@/views/DSGVO.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        requiresRole: "benutzer",
      },
    },
    {
      path: "/users",
      name: "users",
      component: UserView,
      meta: {
        requiresRole: "admin",
      },
    },
    {
      path: "/newuser",
      name: "newuser",
      component: NewUserView,
      meta: {
        requiresRole: "admin",
      },
    },
    {
      path: "/edituser",
      name: "edituser",
      component: EditUserView,
      meta: {
        requiresRole: "admin",
      },
    },
    {
      path: "/changePassword",
      name: "changePassword",
      component: ChangePassword,
      meta: {
        requiresRole: "benutzer",
      },
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/impressum",
      name: "impressum",
      component: Impressum,
    },
    {
      path: "/dsgvo",
      name: "dsgvo",
      component: DSGVO,
    }
  ],
});

// diese wartefunktion ist notwendig weil die route vorher aufgerufen wird
// vor die antwort von getSessionData in App.vue fertig ist
async function waitForSessionData(userStore, timeout = 5000) {
  const interval = 100; // Intervall in Millisekunden für die Überprüfung
  let elapsedTime = 0;

  while (elapsedTime < timeout) {
    if (userStore.getSessionDataFinished) {
      return true;
    }
    console.log("warten");
    await new Promise((resolve) => setTimeout(resolve, interval));
    elapsedTime += interval;
  }
  throw new Error("Timeout abgelaufen!");
}

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const requiredRole = to.meta.requiresRole;

  if (requiredRole) {
    // Prüfe, ob der Benutzer eingeloggt ist und die erforderliche Rolle hat
    const userStore = useUserStore();

    await waitForSessionData(userStore);

    if (userStore.hasRole(requiredRole)) {
      next(); // Benutzer hat die richtige Rolle, Route erlauben
    } else {
      next({ name: "login" }); // Umleiten, falls die Rolle nicht passt
    }
  } else {
    next(); // Wenn keine Rolle erforderlich ist, Route erlauben
  }
});

export default router;
