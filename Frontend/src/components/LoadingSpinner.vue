<template>
  <div :class="['spinner-wrap', { small }]">
    <div class="spinner" />
  </div>
</template>

<script setup>
defineProps({
  small: { type: Boolean, default: false },
})
</script>

<style scoped>
.spinner-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.spinner-wrap.small {
  padding: 0;
  display: inline-flex;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.small .spinner {
  width: 18px;
  height: 18px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
