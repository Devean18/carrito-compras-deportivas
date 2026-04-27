<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>{{ t('login.title') }}</h2>

      <div v-if="error" class="alert alert-error">
        <span class="alert-icon">⚠️</span>
        <span class="alert-msg">{{ error }}</span>
        <button class="alert-close" @click="authStore.error = null" title="Cerrar">✕</button>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">{{ t('login.email') }}</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div class="form-group">
          <label for="password">{{ t('login.password') }}</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <button class="btn-primary btn-block" type="submit" :disabled="authStore.loading">
          <LoadingSpinner v-if="authStore.loading" small />
          <span v-else>{{ t('login.submit') }}</span>
        </button>
      </form>

      <p class="auth-footer">
        {{ t('login.noaccount') }}
        <RouterLink to="/register">{{ t('login.register') }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore }      from '@/stores/auth'
import { useCartStore }      from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import { useOrdersStore }    from '@/stores/orders'
import { useLocaleStore }    from '@/stores/locale'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const router         = useRouter()
const route          = useRoute()
const authStore      = useAuthStore()
const cartStore      = useCartStore()
const favoritesStore = useFavoritesStore()
const ordersStore    = useOrdersStore()
const localeStore    = useLocaleStore()
const t = (key) => localeStore.t(key)

const form = ref({ email: '', password: '' })
const error = computed(() => authStore.error)

onMounted(() => { authStore.error = null })

const handleLogin = async () => {
  try {
    await authStore.login(form.value)
    // Cargar todos los datos del usuario en paralelo
    await Promise.all([
      cartStore.fetchCart(),
      favoritesStore.fetchFavorites(),
      ordersStore.fetchOrders(),
    ])
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch {
    // error en el store
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0,0,0,.08);
  animation: scaleIn 0.45s cubic-bezier(.22,.68,0,1.1) both;
}

.auth-card h2 { margin-bottom: 1.5rem; text-align: center; }

.auth-footer {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.auth-footer a { color: var(--color-primary); text-decoration: none; }

.alert-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  font-size: 0.9rem;
}
.alert-msg { flex: 1; }
.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #b91c1c;
  font-size: 1rem;
  padding: 0 0.25rem;
  line-height: 1;
}
.alert-close:hover { opacity: 0.7; }
</style>
