<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { currentUser, isAuthenticated, logout } from '../../auth'

const user = ref<string | null>(null)

onMounted(() => {
  // 未认证访问 /admin → 跳转登录页
  if (!isAuthenticated()) {
    window.location.replace('/admin/login')
    return
  }

  user.value = currentUser()
})

function handleLogout() {
  logout()
  window.location.replace('/admin/login')
}
</script>

<template>
  <section class="admin-panel">
    <h1>Admin</h1>
    <p class="admin-panel-tagline">Manage your site content.</p>

    <div class="admin-bar">
      <span class="admin-user">Signed in as <strong>{{ user || 'admin' }}</strong></span>
      <button type="button" class="admin-logout" @click="handleLogout">Logout</button>
    </div>

    <div class="admin-placeholder">
      <p>This is a placeholder admin area.</p>
      <p class="admin-links">
        <a href="/pages/albums">Album collections</a>
        ·
        <a href="/catalogues?tab=RV">Work catalogues</a>
        ·
        <a href="/pages/composers">Composers</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.admin-panel {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 0;
}

.admin-panel h1 {
  margin: 0 0 .25rem;
  font-family: var(--font-ui);
  font-weight: 600;
  letter-spacing: -.01em;
}

.admin-panel-tagline {
  margin: 0 0 1.5rem;
  color: var(--md-on-surface-variant);
  font-size: .9rem;
}

.admin-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .65rem .85rem;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-md);
  background: var(--md-surface-container-low);
}

.admin-user {
  font-size: .85rem;
  color: var(--md-on-surface-variant);
}

.admin-logout {
  padding: .4rem .9rem;
  border: 1px solid var(--md-outline);
  border-radius: var(--md-radius-full);
  background: transparent;
  color: var(--md-on-surface);
  font: 500 13px var(--vp-font-family-base);
  letter-spacing: .01em;
  cursor: pointer;
  transition:
      background var(--md-duration-fast) var(--md-ease),
      border-color var(--md-duration-fast) var(--md-ease),
      color var(--md-duration-fast) var(--md-ease);
}

.admin-logout:hover {
  background: var(--md-primary);
  border-color: var(--md-primary);
  color: var(--md-on-primary);
}

.admin-placeholder {
  margin-top: 1.5rem;
  padding: 1.25rem 1.4rem;
  border: 1px dashed var(--md-outline-variant);
  border-radius: var(--md-radius-md);
  background: var(--md-surface-container-low);
  color: var(--md-on-surface-variant);
  font-size: .9rem;
}

.admin-links {
  margin: .5rem 0 0;
  font-size: .85rem;
}
</style>