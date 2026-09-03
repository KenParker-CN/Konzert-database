<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isAuthenticated, login } from '../../auth'

const identifier = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

onMounted(() => {
  // 已登录访问登录页 → 直接进入 /admin
  if (isAuthenticated()) {
    window.location.replace('/admin')
  }
})

function handleSubmit() {
  if (submitting.value) return

  const id = identifier.value.trim()
  const pass = password.value

  if (!id || !pass) {
    error.value = 'Please enter username/email and password.'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    const ok = login(id, pass)

    if (ok) {
      window.location.replace('/admin')
      return
    }

    error.value = 'Invalid credentials. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="admin-login">
    <h1>Admin Login</h1>
    <p class="admin-login-hint">Sign in to access the admin area.</p>

    <form class="admin-login-form" @submit.prevent="handleSubmit">
      <label>
        <span>Username or Email</span>
        <input
            v-model="identifier"
            type="text"
            name="identifier"
            autocomplete="username"
            placeholder="Username or Email"
            required
        >
      </label>

      <label>
        <span>Password</span>
        <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="Password"
            required
        >
      </label>

      <p v-if="error" class="admin-login-error" role="alert">
        {{ error }}
      </p>

      <button
          type="submit"
          class="admin-login-submit"
          :disabled="submitting"
      >
        {{ submitting ? 'Signing in…' : 'Login' }}
      </button>
    </form>

    <p class="admin-login-back">
      <a href="/">← Back to home</a>
    </p>
  </section>
</template>

<style scoped>
.admin-login {
  max-width: 380px;
  margin: 0 auto;
  padding: 2.5rem 0;
}

.admin-login h1 {
  margin: 0 0 .25rem;
  font-family: var(--font-ui);
  font-weight: 400;
  letter-spacing: -.02em;
}

.admin-login-hint {
  margin: 0 0 1.5rem;
  color: var(--md-on-surface-variant);
  font-size: .9rem;
}

.admin-login-form {
  display: flex;
  flex-direction: column;
  gap: .9rem;
}

.admin-login-form label {
  display: flex;
  flex-direction: column;
  gap: .35rem;
  font-size: .8rem;
  font-weight: 600;
  color: var(--md-on-surface-variant);
}

.admin-login-form input {
  height: 40px;
  padding: 0 .7rem;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-sm);
  background: var(--md-surface-container-lowest);
  color: var(--md-on-surface);
  font: inherit;
  font-size: .9rem;
  transition: border-color var(--md-duration-fast) var(--md-ease), box-shadow var(--md-duration-fast) var(--md-ease);
}

.admin-login-form input:focus {
  outline: 0;
  border-color: var(--md-primary);
  box-shadow: 0 0 0 1px var(--md-primary);
}

.admin-login-error {
  margin: 0;
  padding: .55rem .7rem;
  border: 1px solid transparent;
  background: var(--md-error-container);
  color: var(--md-on-error-container);
  font-size: .82rem;
  border-radius: var(--md-radius-sm);
}

.admin-login-submit {
  height: 42px;
  border: 1px solid transparent;
  border-radius: var(--md-radius-full);
  background: var(--md-primary);
  color: var(--md-on-primary);
  font: 600 14px var(--vp-font-family-base);
  letter-spacing: .01em;
  cursor: pointer;
  transition:
      background var(--md-duration-fast) var(--md-ease),
      box-shadow var(--md-duration-fast) var(--md-ease);
}

.admin-login-submit:hover:not(:disabled) {
  background: color-mix(in srgb, var(--md-primary) 88%, var(--md-on-primary));
  box-shadow: var(--md-shadow-1);
}

.admin-login-submit:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.admin-login-back {
  margin-top: 1.25rem;
  text-align: center;
  font-size: .85rem;
}
</style>