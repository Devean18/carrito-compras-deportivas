<template>
  <div class="product-card">
    <div class="product-image">
      <img :src="product.imageUrl || '/placeholder.png'" :alt="product.name" loading="lazy" />
      <span class="category-badge">{{ t('cat.' + product.category) }}</span>
      <button
        class="btn-heart"
        :class="{ active: favoritesStore.isFavorite(product.id) }"
        :title="favoritesStore.isFavorite(product.id) ? t('fav.remove') : t('fav.add')"
        @click.stop="handleFavorite"
      >
        <Heart
          :size="16"
          :fill="favoritesStore.isFavorite(product.id) ? 'var(--color-primary)' : 'none'"
          :stroke="favoritesStore.isFavorite(product.id) ? 'var(--color-primary)' : 'currentColor'"
        />
      </button>
    </div>

    <div class="product-body">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-price">{{ mxn(product.price) }}</p>
      <p class="product-stock" :class="{ 'low-stock': product.stock < 5 }">
        {{ product.stock > 0 ? `${product.stock} ${t('products.stock')}` : t('products.nostock') }}
      </p>
    </div>

    <div class="product-footer">
      <button
        class="btn-primary btn-block"
        :disabled="product.stock === 0"
        @click="$emit('add-to-cart', product)"
      >
        {{ product.stock === 0 ? t('products.nostock') : t('products.addcart') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Heart } from 'lucide-vue-next'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore }      from '@/stores/auth'
import { useLocaleStore }    from '@/stores/locale'

const mxn = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

const props = defineProps({
  product: { type: Object, required: true },
})
defineEmits(['add-to-cart'])

const router         = useRouter()
const favoritesStore = useFavoritesStore()
const authStore      = useAuthStore()
const localeStore    = useLocaleStore()
const t = (key) => localeStore.t(key)

const handleFavorite = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  await favoritesStore.toggle(props.product)
}
</script>

<style scoped>
.product-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s;
}

.product-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  transform: translateY(-2px);
}

.product-image {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  text-transform: capitalize;
  font-weight: 600;
}

.product-body { padding: 0.9rem 1rem 0; flex: 1; }
.product-name { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.35rem; }
.product-price { font-size: 1.15rem; font-weight: 700; color: var(--color-primary); }
.product-stock { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.2rem; }
.low-stock { color: #ef4444; }

.product-footer { padding: 0.75rem 1rem 1rem; }

.btn-heart {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
  color: var(--color-text-muted);
  transition: transform 0.15s, color 0.15s;
  z-index: 1;
}
.btn-heart:hover {
  transform: scale(1.2);
  color: var(--color-primary);
}
.btn-heart.active {
  background: rgba(255,255,255,0.95);
}
</style>
