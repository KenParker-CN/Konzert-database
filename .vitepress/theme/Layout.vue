<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <footer class="site-footer">
        <a href="/">Home</a>
        <a href="/pages/composers">Composers</a>
        <a href="/catalogues?tab=RV">Catalogues</a>
        <a href="/pages/albums">Collections</a>
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
      </footer>
    </template>
  </DefaultTheme.Layout>
</template>

<style>
.site-footer { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 18px; padding: 28px 24px 36px; border-top: 1px solid var(--vp-c-divider); font-size: 13px; }
.site-footer a { color: var(--vp-c-text-2); text-decoration: none; }
.site-footer a:hover { color: var(--vp-c-brand-1); }
</style>
