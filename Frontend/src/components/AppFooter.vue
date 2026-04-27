<template>
  <footer class="app-footer">
    <div class="container footer-inner">

      <div class="footer-brand">
        <ShoppingBag :size="16" stroke-width="1.5" />
        <span>Carrito Deportivo</span>
      </div>


      <p class="footer-powered">
        powered by
        <span class="ft-blau">BLAU</span><span class="ft-tech">TECH</span>
      </p>

    </div>
  </footer>
</template>

<script setup>
import { ShoppingBag } from 'lucide-vue-next'
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 1.25rem 0;
  margin-top: auto;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.footer-brand svg { color: var(--color-primary); }

.footer-copy {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.footer-powered {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
}

.ft-blau { color: #1a3a6e; font-weight: 700; }
.ft-tech { color: #4aa8d8; font-weight: 700; }
</style>
