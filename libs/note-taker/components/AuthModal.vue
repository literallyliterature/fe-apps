<template>
  <v-dialog
    v-model="showingModal"
    max-width="500"
  >
    <v-card
      style="position: relative"
      title="Auth"
    >
      <v-btn
        icon="fa-solid fa-times"
        style="position: absolute; top: 6px; right: 6px"
        size="small"
        variant="flat"
        @click="showingModal = false" />

      <v-card-text>
        <div v-if="currentDetails.type === 'show-login'">
          <v-form @submit.prevent="login">
            <v-text-field
              v-model="email"
              autofocus
              label="Email"
              required
              type="email"
              variant="outlined" />

            <v-text-field
              v-model="password"
              label="Password"
              required
              type="password"
              variant="outlined" />

            <v-expand-transition>
              <div v-if="loginError">
                <div class="pb-4 text-body-medium text-error">
                  {{ loginError }}
                </div>
              </div>
            </v-expand-transition>

            <div class="d-flex justify-end">
              <v-btn
                color="primary"
                :loading="requestInProgress"
                text="Login"
                variant="elevated"
                type="submit"
                @click="login" />
            </div>
          </v-form>
        </div>

        <div v-else>
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-label-medium mb-1">
                Logged in as
              </div>
              <div class="text-body-medium">
                {{ currentDetails.email }}
              </div>
            </div>

            <v-btn
              color="primary"
              :loading="loggingOut"
              text="Logout"
              variant="elevated"
              @click="logout" />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseAuth } from 'utils';
import {
  ref,
  shallowRef,
  watch,
} from 'vue';

import { useNoteTakerStore } from '../data/note-taker.store';

const emit = defineEmits<{
  'update:showingModal': [boolean];
}>();

const showingModal = ref(false);

watch(showingModal, v => emit('update:showingModal', v));

const store = useNoteTakerStore();

type CurrentDetails
  = | { email: string; type: 'logged-in' }
    | { type: 'show-login' };

const currentDetails = shallowRef<CurrentDetails>({ type: 'show-login' });

const email = ref('');
const password = ref('');
const loginError = ref('');

const requestInProgress = ref(false);
const loggingOut = ref(false);

async function login() {
  if (!email.value || !password.value) return;

  loginError.value = '';
  requestInProgress.value = true;

  try {
    await signInWithEmailAndPassword(firebaseAuth, email.value, password.value);
    showingModal.value = false;
  } catch {
    loginError.value = 'Login failed. Please try again';
  }

  requestInProgress.value = false;
}

async function logout() {
  loggingOut.value = true;
  await signOut(firebaseAuth);

  showingModal.value = false;
  loggingOut.value = false;
}

function showModal() {
  email.value = '';
  password.value = '';
  loginError.value = '';

  updateCurrentDetails();

  showingModal.value = true;
}

function updateCurrentDetails() {
  currentDetails.value = store.loggedInUser
    ? { email: store.loggedInUser.email ?? '', type: 'logged-in' }
    : { type: 'show-login' };
}

defineExpose({
  showModal,
});
</script>
