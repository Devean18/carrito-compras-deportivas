<template>
  <AppHeader />

  <main>
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in" @enter="onPageEnter" @leave="onPageLeave">
        <component :is="Component" :key="$route.path" />
      </Transition>
    </RouterView>
  </main>

  <AppFooter />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { useAuthStore }      from '@/stores/auth'
import { useCartStore }      from '@/stores/cart'
import { useOrdersStore }    from '@/stores/orders'
import { useFavoritesStore } from '@/stores/favorites'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'

const authStore      = useAuthStore()
const cartStore      = useCartStore()
const ordersStore    = useOrdersStore()
const favoritesStore = useFavoritesStore()

let _syncInterval = null
let _isVisible = ref(true)

// ── Transiciones de página con GSAP ──
const onPageEnter = (el, done) => {
  gsap.fromTo(el,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', onComplete: done }
  )
}
const onPageLeave = (el, done) => {
  gsap.to(el, { opacity: 0, y: -10, duration: 0.22, ease: 'power2.in', onComplete: done })
}

// ── Sincronización al montar ──
onMounted(() => {
  if (authStore.isAuthenticated) {
    // Cargar datos iniciales (cache-first para carrito)
    if (cartStore.items.length === 0) cartStore.fetchCart()
    
    if (ordersStore.orders.length === 0) ordersStore.fetchOrders()
    favoritesStore.fetchFavorites()
    
    // Revalidar carrito cada 30 segundos (solo si la página está visible)
    _syncInterval = setInterval(() => {
      if (_isVisible.value && authStore.isAuthenticated) {
        cartStore.revalidateCart()
      }
    }, 30000)
  }

  // Detectar visibilidad de la página
  document.addEventListener('visibilitychange', () => {
    _isVisible.value = !document.hidden
    
    // Si la página se vuelve visible, revalidar datos
    if (_isVisible.value && authStore.isAuthenticated) {
      cartStore.revalidateCart()
    }
  })
})

// Cleanup
onUnmounted(() => {
  if (_syncInterval) clearInterval(_syncInterval)
})
</script>

<style>
/* ─── Variables de diseño ─── */
:root {
  --color-primary:    #2563eb;
  --color-primary-h:  #1d4ed8;
  --color-danger:     #ef4444;
  --color-surface:    #ffffff;
  --color-bg:         #f9fafb;
  --color-border:     #e5e7eb;
  --color-text:       #111827;
  --color-text-muted: #6b7280;
}

/* ─── Reset básico ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.main-content { padding: 2rem 1.5rem; }

.page-wrapper { padding: 2rem 1.5rem; }

/* ─── Botones ─── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.55rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: var(--color-primary-h); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary.btn-block { width: 100%; }
.btn-primary.btn-sm    { padding: 0.35rem 0.85rem; font-size: 0.82rem; }

.btn-ghost {
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 0.4rem;
  padding: 0.35rem 0.75rem;
  color: var(--color-text);
  font-size: 0.9rem;
  transition: background 0.15s;
}
.btn-ghost:hover { background: var(--color-border); }

/* ─── Formularios ─── */
.form-group { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1rem; }
.form-group label { font-size: 0.87rem; font-weight: 500; }
.form-group input {
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
}
.form-group input:focus { border-color: var(--color-primary); }

/* ─── Alertas ─── */
.alert {
  padding: 0.7rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.alert-error   { background: #fee2e2; color: #b91c1c; }
.alert-success { background: #d1fae5; color: #065f46; }

/* ─── Keyframes ─── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}

/* ─── Scroll reveal (estado inicial — GSAP anima) ─── */
.reveal        { opacity: 0; transform: translateY(28px); }
.reveal.visible { opacity: 1; transform: translateY(0); }    /* fallback sin JS */
.reveal-scale  { opacity: 0; transform: scale(0.93); }
.reveal-scale.visible { opacity: 1; transform: scale(1); }   /* fallback sin JS */

/* ─── Transiciones de página ─── */
main { position: relative; overflow-x: hidden; }

/* ─── Section headings (global) ─── */
.section-eyebrow {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 0.45rem;
}
.section-title {
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.2;
  margin: 0;
}
.section-title-line {
  display: block;
  width: 44px;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), #60a5fa);
  border-radius: 2px;
  margin-top: 0.65rem;
}
.section-head-block { margin-bottom: 2rem; }
</style>
