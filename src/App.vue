<template>
  <div class="app">
    <ChatPage />
  </div>
</template>

<script setup lang="ts">
import ChatPage from './components/ChatPage.vue'
</script>

<style scoped>
.app { 
  min-height: 100vh; 
  background: var(--bg); 
  color: var(--fg); 
  display: flex;
  flex-direction: column;
}
</style>