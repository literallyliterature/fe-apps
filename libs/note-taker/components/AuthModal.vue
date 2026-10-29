<template>
  <v-dialog
    v-model="showingModal"
    max-width="500"
  >
    <v-card
      title="Auth"
    >
      <v-card-text>
        <div v-if="currentDetails.type === 'show-login'">
          <v-form>
            <v-text-field
              v-model="email"
              label="Email"
              required
              type="email" />

            <v-text-field
              v-model="password"
              label="Password"
              required
              type="password" />
          </v-form>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          color="primary"
          text="Login"
          variant="elevated"
          @click="login" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from 'utils';
import {
  computed,
  ref,
  watch,
} from 'vue';

const emit = defineEmits<{
  'update:showingModal': [boolean];
}>();

const showingModal = ref(false);

watch(showingModal, v => emit('update:showingModal', v));

type CurrentDetails
  = | { email: string; type: 'logged-in' }
    | { type: 'show-login' }
    | { type: 'show-signup' };

const currentDetails = computed((): CurrentDetails => ({ type: 'show-login' }));

const email = ref('');
const password = ref('');

async function login() {
  try {
    await signInWithEmailAndPassword(firebaseAuth, email.value, password.value);
    showingModal.value = false;
  } catch (error) {
    console.error(error);
  }
}

function showModal() {
  showingModal.value = true;
}

defineExpose({
  showModal,
});
</script>
