<template>
  <div class="cart-page container page-wrapper">
    <div class="section-head-block reveal">
      <span class="section-eyebrow">{{ t('cart.eyebrow') }}</span>
      <h2 class="section-title">{{ t('cart.title') }}</h2>
      <span class="section-title-line"></span>
    </div>

    <LoadingSpinner v-if="cartStore.loading && cartStore.items.length === 0" />

    <div v-else-if="cartStore.items.length === 0" class="empty-cart">
      <p>{{ t('cart.empty') }}</p>
      <RouterLink to="/" class="btn-primary">{{ t('cart.see') }}</RouterLink>
    </div>

    <template v-else>
      <div class="cart-list reveal reveal-d1">
        <CartItem
          v-for="item in cartStore.items"
          :key="item.productId"
          :item="item"
          @remove="cartStore.removeItem(item.productId)"
          @update="(qty) => cartStore.updateItem(item.productId, qty)"
        />
      </div>

      <div class="cart-summary reveal reveal-d2">
        <div class="summary-row">
          <span>{{ t('cart.items') }} ({{ cartStore.itemCount }})</span>
          <span>{{ mxn(cartStore.total) }}</span>
        </div>
        <div class="summary-row total">
          <strong>{{ t('cart.total') }}</strong>
          <strong>{{ mxn(cartStore.total) }}</strong>
        </div>

        <div v-if="cartStore.checkoutError" class="alert alert-error">
          {{ cartStore.checkoutError }}
        </div>

        <div v-if="checkoutSuccess" class="alert alert-success">
          ✅ {{ t('cart.success') }}
        </div>

        <button
          class="btn-primary btn-block"
          :disabled="cartStore.checkoutLoading"
          @click="handleCheckout"
        >
          <LoadingSpinner v-if="cartStore.checkoutLoading" small />
          <span v-else>{{ t('cart.checkout') }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore }     from '@/stores/cart'
import { useLocaleStore }   from '@/stores/locale'
import CartItem from '@/components/CartItem.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useReveal } from '@/composables/useReveal'

const router      = useRouter()
const cartStore   = useCartStore()
const localeStore = useLocaleStore()
const t = (key) => localeStore.t(key)
const checkoutSuccess = ref(false)

const mxn = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

// Solo recargar el carrito si está vacío (cache-first strategy)
onMounted(() => {
  if (cartStore.items.length === 0) {
    cartStore.fetchCart()
  }
})
useReveal()

const handleCheckout = async () => {
  try {
    await cartStore.checkout()
    checkoutSuccess.value = true
    setTimeout(() => router.push('/orders'), 2000)
  } catch {
    // error en el store
  }
}
</script>

<style scoped>
.cart-page { max-width: 760px; margin: 0 auto; padding: 1.5rem 0; }
.cart-page .section-head-block { margin-bottom: 1.5rem; }

.empty-cart {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.cart-list { display: flex; flex-direction: column; gap: 1rem; }

.cart-summary {
  margin-top: 2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  color: var(--color-text-muted);
}

.summary-row.total {
  border-top: 1px solid var(--color-border);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  font-size: 1.1rem;
  color: var(--color-text);
}

button { margin-top: 1.25rem; }
.page-wrapper { padding: 2rem 1.5rem; }
</style>
