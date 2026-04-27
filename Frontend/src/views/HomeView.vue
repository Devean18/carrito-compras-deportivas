<template>
  <div class="home">

    <!-- ═══════════════════════════════════════════
         HERO
    ═══════════════════════════════════════════ -->
    <section class="hero">
      <div class="hero-overlay" />
      <div class="container hero-inner">

        <!-- Izquierda: headline + búsqueda -->
        <div class="hero-content">
          <p class="hero-eyebrow">{{ t('home.eyebrow') }}</p>
          <h1 class="hero-title">
            {{ t('home.title1') }}<br />
            <span>{{ t('home.title2') }}</span><br />
            {{ t('home.title3') }}
          </h1>
          <p class="hero-sub">{{ t('home.subtitle') }}</p>

          <!-- Barra de búsqueda hero -->
          <div class="hero-search">
            <Search :size="18" class="hero-search-icon" />
            <input
              v-model="productsStore.search"
              type="text"
              :placeholder="t('nav.search')"
              @keydown.escape="productsStore.search = ''"
            />
            <button
              v-if="productsStore.search"
              class="hero-search-clear"
              @click="productsStore.search = ''"
            >
              <X :size="15" />
            </button>
            <button class="hero-search-btn" @click="goToProducts">{{ t('home.search.btn') }}</button>
          </div>
        </div>

        <!-- Derecha: mini carrito -->
        <div v-if="cartStore.items.length > 0" class="hero-cart">
          <div class="hc-header">
            <ShoppingCart :size="18" />
            <span>{{ t('home.cart.title') }}</span>
            <span class="hc-count">{{ cartStore.itemCount }} {{ cartStore.itemCount !== 1 ? t('home.cart.products') : t('home.cart.product') }}</span>
          </div>

          <div class="hc-items">
            <div v-for="item in cartStore.items" :key="item.productId" class="hc-item">
              <img :src="item.imageUrl || '/placeholder.png'" :alt="item.name" />
              <div class="hc-item-info">
                <span class="hc-item-name">{{ item.name }}</span>
                <span class="hc-item-price">{{ mxn(item.price) }}</span>
              </div>
              <div class="hc-item-stepper">
                <button class="hc-step-btn" @click="cartStore.updateItem(item.productId, item.quantity - 1)">−</button>
                <span class="hc-step-qty">{{ item.quantity }}</span>
                <button class="hc-step-btn" @click="cartStore.updateItem(item.productId, item.quantity + 1)">+</button>
              </div>
              <button class="hc-remove" :title="t('fav.remove')" @click="cartStore.removeItem(item.productId)">
                <Trash2 :size="13" />
              </button>
            </div>
          </div>

          <div class="hc-footer">
            <p v-if="cartStore.checkoutError" class="hc-error">{{ cartStore.checkoutError }}</p>
            <div class="hc-total">
              <span>{{ t('home.cart.total') }}</span>
              <strong>{{ mxn(cartStore.total) }}</strong>
            </div>
            <button class="hc-btn hc-btn-danger" :disabled="cartStore.checkoutLoading" @click="cartStore.clearCart()">{{ t('home.cart.clear') }}</button>
            <button class="hc-btn hc-btn-primary" :disabled="cartStore.checkoutLoading" @click="handleCheckout">
              <LoadingSpinner v-if="cartStore.checkoutLoading" small />
              <span v-else>{{ t('home.cart.buy') }}</span>
            </button>
          </div>
        </div>

        <!-- Derecha vacía: CTA decorativo -->
        <div v-else class="hero-cta-box">
          <div class="hero-cta-icon"><Zap :size="36" /></div>
          <p>{{ t('home.cta.shipping') }} <strong>$999 MXN</strong></p>
          <RouterLink v-if="!authStore.isAuthenticated" to="/register" class="btn-primary">
            {{ t('home.cta.register') }}
          </RouterLink>
        </div>

      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         BARRA DE BENEFICIOS
    ═══════════════════════════════════════════ -->
    <section class="features-bar">
      <div class="container features-inner">
        <div class="feature-item">
          <Truck :size="22" />
          <div>
            <strong>{{ t('home.features.ship') }}</strong>
            <span>{{ t('home.features.ship.sub') }}</span>
          </div>
        </div>
        <div class="feature-item">
          <ShieldCheck :size="22" />
          <div>
            <strong>{{ t('home.features.sec') }}</strong>
            <span>{{ t('home.features.sec.sub') }}</span>
          </div>
        </div>
        <div class="feature-item">
          <RotateCcw :size="22" />
          <div>
            <strong>{{ t('home.features.ret') }}</strong>
            <span>{{ t('home.features.ret.sub') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         GALERÍA DE CATEGORÍAS
    ═══════════════════════════════════════════ -->
    <section class="cat-gallery-section">
      <div class="container">
        <div class="section-head-block reveal">
          <span class="section-eyebrow">{{ t('home.cat.eyebrow') }}</span>
          <h2 class="section-title">{{ t('home.cat.title') }}</h2>
          <span class="section-title-line"></span>
        </div>
        <div class="cat-gallery-grid">
          <button
            v-for="(cat, i) in galleryCategories"
            :key="cat.value"
            class="cat-gallery-card reveal"
            :class="`reveal-d${i + 1}`"
            :style="{ background: cat.gradient }"
            @click="goToCategory(cat.value)"
          >
            <div class="cg-icon"><component :is="cat.icon" :size="26" stroke-width="1.5" /></div>
            <h3 class="cg-label">{{ cat.label }}</h3>
            <span class="cg-cta">{{ t('home.cat.cta') }} <ArrowRight :size="13" stroke-width="2" /></span>
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         PRODUCTOS
    ═══════════════════════════════════════════ -->
    <section class="products-section">
      <div class="container">

        <div class="section-head">
          <div class="section-head-left reveal">
            <span class="section-eyebrow">{{ t('home.prod.eyebrow') }}</span>
            <h2 class="section-title">{{ t('home.prod.title') }}</h2>
            <span class="section-title-line"></span>
            <p style="margin-top:.5rem;font-size:.85rem;color:var(--color-text-muted)">{{ sortedItems.length }} {{ t('home.prod.found') }}</p>
          </div>
          <div class="section-head-controls">
            <!-- Ordenar -->
            <div class="ctrl-sort">
              <ArrowUpDown :size="14" stroke-width="1.5" />
              <select v-model="productsStore.sortBy" class="ctrl-select">
                <option value="">{{ t('products.sort.rel') }}</option>
                <option value="price-asc">{{ t('products.sort.pa') }}</option>
                <option value="price-desc">{{ t('products.sort.pd') }}</option>
                <option value="name-asc">{{ t('products.sort.na') }}</option>
              </select>
            </div>
            <div class="ctrl-sep" />
            <!-- Precio -->
            <div class="ctrl-price">
              <SlidersHorizontal :size="14" stroke-width="1.5" />
              <input v-model="productsStore.minPriceInput" type="number" placeholder="Mín" class="ctrl-price-in" min="0" @keydown.enter="applyPrice" />
              <span class="ctrl-dash">–</span>
              <input v-model="productsStore.maxPriceInput" type="number" placeholder="Máx" class="ctrl-price-in" min="0" @keydown.enter="applyPrice" />
              <button class="ctrl-btn-apply" @click="applyPrice">{{ t('products.apply') }}</button>
            </div>
          </div>
        </div>

        <!-- Filtros de categoría -->
        <div class="filters">
          <button
            v-for="cat in categories"
            :key="cat.value"
            :class="['filter-btn', { active: activeCategory === cat.value }]"
            @click="selectCategory(cat.value)"
          >
            <component :is="cat.icon" :size="15" />
            {{ cat.label }}
          </button>
        </div>

        <!-- Cargando -->
        <div v-if="productsStore.loading && productsStore.items.length === 0" class="loading-msg">
          {{ t('products.loading') }}
        </div>

        <!-- Error -->
        <div v-else-if="productsStore.error" class="error-msg">{{ productsStore.error }}</div>

        <!-- Grid -->
        <div v-else class="products-grid">
          <ProductCard
            v-for="product in sortedItems"
            :key="product.id"
            :product="product"
            @add-to-cart="handleAddToCart"
          />
        </div>

        <!-- Sin resultados -->
        <div v-if="!productsStore.loading && sortedItems.length === 0" class="empty-msg">
          {{ productsStore.search
            ? `${t('products.empty.q')} "${productsStore.search}"`
            : t('products.empty') }}
        </div>

        <!-- Paginación -->
        <div v-if="sortedItems.length > 0 && !productsStore.error" class="pagination-section">

          <!-- Rango -->
          <p class="pg-range">
            {{ productsStore.rangeStart }}–{{ productsStore.rangeEnd }}
            {{ t('products.of') }} <strong>{{ productsStore.totalCount }}</strong> {{ t('products.results') }}
          </p>

          <!-- Botones de página -->
          <div class="pg-controls">
            <button
              class="pg-btn pg-prev"
              :disabled="productsStore.currentPage === 1 || productsStore.loading"
              @click="productsStore.prevPage()"
            >
              <ChevronLeft :size="16" stroke-width="2" />
              {{ t('products.prev') }}
            </button>

            <button
              v-for="p in productsStore.totalPages"
              :key="p"
              :class="['pg-btn pg-num', { active: p === productsStore.currentPage }]"
              :disabled="productsStore.loading"
              @click="productsStore.goToPage(p)"
            >
              <Loader2 v-if="productsStore.loading && p === productsStore.currentPage" :size="13" class="spin" />
              <template v-else>{{ p }}</template>
            </button>

            <button
              class="pg-btn pg-next"
              :disabled="productsStore.currentPage === productsStore.totalPages || productsStore.loading"
              @click="productsStore.nextPage()"
            >
              {{ t('products.next') }}
              <ChevronRight :size="16" stroke-width="2" />
            </button>
          </div>

        </div>

      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, X, ShoppingCart, Truck, ShieldCheck, RotateCcw,
  Zap, Layers, Footprints, Shirt, Watch, CircleDot, Bike,
  SlidersHorizontal, ArrowUpDown, Loader2, ChevronLeft, ChevronRight, ArrowRight, Trash2,
} from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import { useCartStore }     from '@/stores/cart'
import { useAuthStore }     from '@/stores/auth'
import { useReveal }        from '@/composables/useReveal'
import { useLocaleStore }   from '@/stores/locale'
import ProductCard    from '@/components/ProductCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const router        = useRouter()
const productsStore = useProductsStore()
const cartStore     = useCartStore()
const authStore     = useAuthStore()
const localeStore   = useLocaleStore()
const t = (key) => localeStore.t(key)

const mxn = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)

const activeCategory = ref('')

const categories = computed(() => [
  { value: '',           label: t('cat.all'),        icon: Layers      },
  { value: 'futbol',     label: t('cat.futbol'),     icon: CircleDot   },
  { value: 'calzado',    label: t('cat.calzado'),    icon: Footprints  },
  { value: 'ropa',       label: t('cat.ropa'),       icon: Shirt       },
  { value: 'accesorios', label: t('cat.accesorios'), icon: Watch       },
  { value: 'tenis',      label: t('cat.tenis'),      icon: CircleDot   },
  { value: 'ciclismo',   label: t('cat.ciclismo'),   icon: Bike        },
])

const galleryCategories = computed(() => [
  { value: 'futbol',     label: t('cat.futbol'),     icon: CircleDot,  gradient: 'linear-gradient(135deg,#065f46,#10b981)' },
  { value: 'calzado',    label: t('cat.calzado'),    icon: Footprints, gradient: 'linear-gradient(135deg,#1e40af,#3b82f6)' },
  { value: 'ropa',       label: t('cat.ropa'),       icon: Shirt,      gradient: 'linear-gradient(135deg,#4c1d95,#8b5cf6)' },
  { value: 'accesorios', label: t('cat.accesorios'), icon: Watch,      gradient: 'linear-gradient(135deg,#78350f,#f59e0b)' },
  { value: 'tenis',      label: t('cat.tenis'),      icon: CircleDot,  gradient: 'linear-gradient(135deg,#881337,#f43f5e)' },
  { value: 'ciclismo',   label: t('cat.ciclismo'),   icon: Bike,       gradient: 'linear-gradient(135deg,#134e4a,#14b8a6)' },
])

const goToCategory = (cat) => {
  selectCategory(cat)
  router.push({ name: 'products' })
}

onMounted(() => productsStore.fetchProducts({ limit: 10 }))
useReveal()


const sortedItems = computed(() => {
  const items = [...productsStore.filteredItems]
  if (productsStore.sortBy === 'price-asc')  return items.sort((a, b) => a.price - b.price)
  if (productsStore.sortBy === 'price-desc') return items.sort((a, b) => b.price - a.price)
  if (productsStore.sortBy === 'name-asc')   return items.sort((a, b) => a.name?.localeCompare(b.name))
  return items
})

const applyPrice = () => {
  productsStore.fetchProducts({
    category: activeCategory.value,
    limit: 10,
    minPrice: productsStore.minPriceInput || null,
    maxPrice: productsStore.maxPriceInput || null,
  })
}

const goToProducts = () => router.push({ name: 'products' })

const selectCategory = (cat) => {
  activeCategory.value = cat
  productsStore.fetchProducts({
    category: cat,
    limit: 10,
    minPrice: productsStore.minPriceInput || null,
    maxPrice: productsStore.maxPriceInput || null,
  })
}

const handleAddToCart = async (product) => {
  if (!authStore.isAuthenticated) { router.push({ name: 'login' }); return }
  try { await cartStore.addItem(product, 1) } catch { /* en store */ }
}

const handleCheckout = async () => {
  if (!authStore.isAuthenticated) { router.push({ name: 'login' }); return }
  try {
    await cartStore.checkout()
    router.push({ name: 'orders' })
  } catch { /* en store */ }
}
</script>

<style scoped>
/* ─── Hero animations ─── */
.hero-eyebrow { animation: fadeUp 0.6s ease both 0.1s; }
.hero-title   { animation: fadeUp 0.65s ease both 0.25s; }
.hero-sub     { animation: fadeUp 0.6s ease both 0.42s; }
.hero-search  { animation: fadeUp 0.6s ease both 0.56s; }
.hero-cart,
.hero-cta-box { animation: fadeUp 0.7s ease both 0.3s; }

/* ─── Hero ─── */
.hero {
  position: relative;
  min-height: 480px;
  background:
    linear-gradient(135deg, rgba(10,15,30,.92) 0%, rgba(20,40,80,.88) 60%, rgba(10,15,30,.92) 100%),
    url('https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&q=80') center/cover no-repeat;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 50%, rgba(37,99,235,.18) 0%, transparent 70%);
  pointer-events: none;
}

.hero-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
  width: 100%;
}

/* ─── Hero content ─── */
.hero-content { flex: 1; max-width: 520px; }

.hero-eyebrow {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 0.75rem;
}

.hero-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.15;
  color: #fff;
  margin-bottom: 0.75rem;
}

.hero-title span { color: var(--color-primary); }

.hero-sub {
  font-size: 0.9rem;
  color: rgba(255,255,255,.5);
  margin-bottom: 2rem;
  letter-spacing: 0.05em;
}

/* Barra de búsqueda del hero */
.hero-search {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255,255,255,.08);
  border: 1.5px solid rgba(255,255,255,.15);
  border-radius: 2rem;
  overflow: hidden;
  backdrop-filter: blur(8px);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.hero-search:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,.25);
}

.hero-search-icon {
  position: absolute;
  left: 1rem;
  color: rgba(255,255,255,.5);
  pointer-events: none;
}

.hero-search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  font-size: 0.95rem;
  color: #fff;
}

.hero-search input::placeholder { color: rgba(255,255,255,.4); }

.hero-search-clear {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,.5);
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}

.hero-search-btn {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 0.75rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.hero-search-btn:hover { background: var(--color-primary-h); }

/* ─── Mini carrito ─── */
.hero-cart {
  width: 320px;
  flex-shrink: 0;
  background: rgba(255,255,255,.06);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 1rem;
  overflow: hidden;
}

.hc-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 1.1rem;
  background: rgba(255,255,255,.05);
  border-bottom: 1px solid rgba(255,255,255,.08);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
}

.hc-count {
  margin-left: auto;
  font-size: 0.78rem;
  color: rgba(255,255,255,.5);
  font-weight: 400;
}

.hc-items { max-height: 220px; overflow-y: auto; padding: 0.5rem 0; }

.hc-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 1.1rem;
  transition: background 0.15s;
}

.hc-item:hover { background: rgba(255,255,255,.04); }

.hc-item img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 0.4rem;
  flex-shrink: 0;
}

.hc-item-info { flex: 1; min-width: 0; }

.hc-item-name {
  display: block;
  font-size: 0.82rem;
  color: rgba(255,255,255,.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hc-item-price {
  display: block;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 600;
}

.hc-item-stepper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255,255,255,.08);
  border-radius: 0.5rem;
  padding: 0.15rem 0.3rem;
  flex-shrink: 0;
}

.hc-step-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,.8);
  font-size: 1rem;
  line-height: 1;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: background 0.15s, color 0.15s;
}

.hc-step-btn:hover:not(:disabled) { background: rgba(255,255,255,.15); color: #fff; }
.hc-step-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.hc-step-qty {
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  min-width: 18px;
  text-align: center;
}

.hc-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,.35);
  display: flex;
  align-items: center;
  padding: 0.2rem;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
}

.hc-remove:hover { color: #ef4444; background: rgba(239,68,68,.1); }

.hc-footer {
  padding: 0.9rem 1.1rem;
  border-top: 1px solid rgba(255,255,255,.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hc-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255,255,255,.7);
  font-size: 0.88rem;
  margin-bottom: 0.2rem;
}

.hc-total strong { color: #fff; font-size: 1.1rem; }

.hc-btn {
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  border: none;
  transition: all 0.15s;
  display: block;
}

.hc-btn-outline {
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.85);
  border: 1px solid rgba(255,255,255,.15);
}

.hc-btn-outline:hover { background: rgba(255,255,255,.14); }

.hc-btn-danger {
  background: rgba(239,68,68,.15);
  color: #fca5a5;
  border: 1px solid rgba(239,68,68,.3);
}
.hc-btn-danger:hover:not(:disabled) {
  background: rgba(239,68,68,.28);
  color: #fecaca;
  border-color: rgba(239,68,68,.5);
}

.hc-btn-primary { background: var(--color-primary); color: #fff; }
.hc-btn-primary:hover:not(:disabled) { background: var(--color-primary-h); }
.hc-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.hc-error {
  font-size: 0.8rem;
  color: #fca5a5;
  background: rgba(239,68,68,.15);
  border: 1px solid rgba(239,68,68,.3);
  border-radius: 0.4rem;
  padding: 0.45rem 0.7rem;
  margin: 0;
}

/* ─── CTA decorativo ─── */
.hero-cta-box {
  width: 280px;
  flex-shrink: 0;
  background: rgba(255,255,255,.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 1rem;
  padding: 2rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.hero-cta-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(37,99,235,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.hero-cta-box p { color: rgba(255,255,255,.7); font-size: 0.9rem; line-height: 1.5; }
.hero-cta-box strong { color: #fff; }

/* ─── Features bar ─── */
.features-bar {
  background: var(--color-primary);
  padding: 1.25rem 0;
}

.features-inner {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #fff;
  flex: 1;
  justify-content: center;
  padding: 0.25rem 1rem;
}

.feature-item + .feature-item {
  border-left: 1px solid rgba(255,255,255,.2);
}

.feature-item svg { flex-shrink: 0; opacity: 0.9; }

.feature-item strong {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
}

.feature-item span {
  display: block;
  font-size: 0.78rem;
  opacity: 0.8;
}

/* ─── Categoría Gallery ─── */
.cat-gallery-section {
  padding: 3.5rem 0;
  background: var(--color-bg);
}

.cat-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 1rem;
}

.cat-gallery-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 1.6rem 1.4rem 1.3rem;
  border-radius: 1.1rem;
  cursor: pointer;
  border: none;
  overflow: hidden;
  text-align: left;
  transition: transform 0.28s cubic-bezier(.22,.68,0,1.2), box-shadow 0.28s ease;
}

.cat-gallery-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.12);
  opacity: 0;
  transition: opacity 0.2s;
}

.cat-gallery-card:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 16px 36px rgba(0,0,0,.2); }
.cat-gallery-card:hover::before { opacity: 1; }

.cg-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.cg-label {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.cg-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255,255,255,.75);
  margin-top: 0.15rem;
}

/* ─── Sección productos ─── */
.products-section { padding: 3rem 0 4rem; }

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.section-head-left h2 {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 0.15rem;
}

.section-head-left p {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* ─── Controles sort + precio ─── */
.section-head-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ctrl-sort {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
}
.ctrl-select {
  padding: 0.35rem 0.65rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.45rem;
  font-size: 0.83rem;
  color: var(--color-text);
  background: var(--color-surface);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}
.ctrl-select:focus { border-color: var(--color-primary); }

.ctrl-sep { width: 1px; height: 20px; background: var(--color-border); flex-shrink: 0; }

.ctrl-price {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-muted);
}
.ctrl-price-in {
  width: 70px;
  padding: 0.3rem 0.45rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.4rem;
  font-size: 0.82rem;
  color: var(--color-text);
  background: var(--color-bg);
  outline: none;
  transition: border-color 0.15s;
  -moz-appearance: textfield;
}
.ctrl-price-in::-webkit-outer-spin-button,
.ctrl-price-in::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ctrl-price-in:focus { border-color: var(--color-primary); }
.ctrl-dash { color: var(--color-text-muted); font-size: 0.85rem; }
.ctrl-btn-apply {
  padding: 0.3rem 0.7rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.79rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.ctrl-btn-apply:hover { background: var(--color-primary-h, #1d4ed8); }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: 2rem;
  background: transparent;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--color-text);
  transition: all 0.2s;
}

.filter-btn.active,
.filter-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

/* ─── Paginación numerada ─── */
.pagination-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  padding: 2.5rem 0 1rem;
}

.pg-range {
  font-size: 0.83rem;
  color: var(--color-text-muted);
  margin: 0;
}
.pg-range strong { color: var(--color-text); }

.pg-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.42rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.45rem;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 36px;
  justify-content: center;
}
.pg-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: #eff6ff;
}
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 700;
}
.pg-prev, .pg-next { padding: 0.42rem 1rem; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }

.empty-msg, .error-msg, .loading-msg {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--color-text-muted);
}

.error-msg { color: var(--color-danger); }
</style>
