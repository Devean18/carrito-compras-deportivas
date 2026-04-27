<template>
  <div class="favorites-page container page-wrapper">
    <div class="section-head-block reveal">
      <span class="section-eyebrow">{{ t('fav.eyebrow') }}</span>
      <h2 class="section-title">{{ t('fav.title') }}</h2>
      <span class="section-title-line"></span>
    </div>

    <div v-if="favoritesStore.loading" class="loading-msg">{{ t('fav.loading') }}</div>

    <div v-else-if="favoritesStore.items.length === 0" class="empty-msg">
      <p>{{ t('fav.empty') }}</p>
      <RouterLink to="/" class="btn-primary">{{ t('fav.see') }}</RouterLink>
    </div>

    <div v-else class="favorites-grid">
      <div
        v-for="(item, index) in favoritesStore.items"
        :key="item.productId"
        :class="['fav-card reveal', `reveal-d${(index % 6) + 1}`]"
      >
        <button class="btn-heart active" @click="favoritesStore.remove(item.productId)" :title="t('fav.remove')">
          <Heart :size="16" :fill="'var(--color-primary)'" :stroke="'var(--color-primary)'" />
        </button>

        <RouterLink to="/" class="fav-image">
          <img :src="item.imageUrl || '/placeholder.png'" :alt="item.name" />
          <span class="category-badge">{{ t('cat.' + item.category) }}</span>
        </RouterLink>

        <div class="fav-body">
          <h3>{{ item.name }}</h3>
          <p class="fav-price">{{ mxn(item.price) }}</p>
        </div>

        <div class="fav-footer">
          <button class="btn-primary btn-block" @click="addToCart(item)">
            {{ t('fav.addcart') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Heart } from 'lucide-vue-next'
import { useFavoritesStore } from '@/stores/favorites'
import { useCartStore }      from '@/stores/cart'
import { useAuthStore }      from '@/stores/auth'
import { useReveal }         from '@/composables/useReveal'
import { useLocaleStore }    from '@/stores/locale'

const router         = useRouter()
const favoritesStore = useFavoritesStore()
const cartStore      = useCartStore()
const authStore      = useAuthStore()
const localeStore    = useLocaleStore()
const t = (key) => localeStore.t(key)

const mxn = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

onMounted(() => favoritesStore.fetchFavorites())
useReveal()

const addToCart = async (item) => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  await cartStore.addItem({ id: item.productId, name: item.name, price: item.price, imageUrl: item.imageUrl }, 1)
}
</script>

<style scoped>
.favorites-page { max-width: 1100px; margin: 0 auto; padding: 1.5rem 0; }
.favorites-page .section-head-block { margin-bottom: 1.5rem; }
.loading-msg { text-align: center; padding: 3rem; color: var(--color-text-muted); }

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
}

.fav-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s;
}
.fav-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  transform: translateY(-2px);
}

.btn-heart {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 2;
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
  transition: transform 0.15s;
}
.btn-heart:hover { transform: scale(1.2); }

.fav-image {
  display: block;
  position: relative;
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
  overflow: hidden;
}
.fav-image img { width: 100%; height: 100%; object-fit: cover; }

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

.fav-body { padding: 0.9rem 1rem 0; flex: 1; }
.fav-body h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.3rem; }
.fav-price { font-size: 1.1rem; font-weight: 700; color: var(--color-primary); }

.fav-footer { padding: 0.75rem 1rem 1rem; }

.empty-msg {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}
</style>
