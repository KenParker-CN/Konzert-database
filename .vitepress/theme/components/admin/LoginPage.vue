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
  font-family: var(--archive-serif), Georgia, serif;
  font-weight: 400;
  letter-spacing: -.02em;
}

.admin-login-hint {
  margin: 0 0 1.5rem;
  color: var(--vp-c-text-2);
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
  color: var(--vp-c-text-2);
}

.admin-login-form input {
  height: 40px;
  padding: 0 .7rem;
  border: 1px solid var(--archive-rule);
  border-radius: 2px;
  background: var(--vp-c-bg-elv);
  color: var(--archive-ink);
  font: inherit;
  font-size: .9rem;
}

.admin-login-form input:focus {
  outline: 0;
  border-color: var(--archive-oxide);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.admin-login-error {
  margin: 0;
  padding: .55rem .7rem;
  border: 1px solid var(--vp-c-danger-1);
  background: color-mix(in srgb, var(--vp-c-danger-1) 12%, transparent);
  color: var(--vp-c-danger-1);
  font-size: .82rem;
  border-radius: 2px;
}

.admin-login-submit {
  height: 42px;
  border: 1px solid var(--archive-ink);
  border-radius: 2px;
  background: var(--archive-ink);
  color: var(--archive-paper);
  font: 700 12px var(--vp-font-family-base);
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
      background var(--archive-ease),
      border-color var(--archive-ease);
}

.admin-login-submit:hover:not(:disabled) {
  background: var(--archive-oxide);
  border-color: var(--archive-oxide);
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