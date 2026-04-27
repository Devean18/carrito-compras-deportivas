<template>
  <div class="products-page container page-wrapper">

    <!-- ════════════════════════════
         CABECERA
    ════════════════════════════ -->
    <div class="page-head">
      <div class="page-head-left reveal">
        <span class="section-eyebrow">{{ t('products.eyebrow') }}</span>
        <h2 class="section-title">{{ t('products.title') }}</h2>
        <span class="section-title-line"></span>
        <p class="page-subtitle">
          <template v-if="productsStore.loading && productsStore.items.length === 0">
            {{ t('products.loading') }}
          </template>
          <template v-else>
            <span>{{ sortedItems.length }} {{ t('products.loaded') }}</span>
            <span v-if="activeCategory" class="filter-pill">
              <component :is="activeCatIcon" :size="12" stroke-width="2" />
              {{ activeCatLabel }}
              <button @click="selectCategory('')"><X :size="11" /></button>
            </span>
            <span v-if="productsStore.minPriceInput || productsStore.maxPriceInput" class="filter-pill price-pill">
              <SlidersHorizontal :size="12" stroke-width="2" />
              {{ productsStore.minPriceInput ? `$${productsStore.minPriceInput}` : '$0' }} – {{ productsStore.maxPriceInput ? `$${productsStore.maxPriceInput}` : '∞' }}
              <button @click="clearPrice"><X :size="11" /></button>
            </span>
            <span v-if="productsStore.search" class="filter-pill search-pill">
              <Search :size="12" stroke-width="2" />
              "{{ productsStore.search }}"
              <button @click="productsStore.search = ''"><X :size="11" /></button>
            </span>
          </template>
        </p>
      </div>

    </div>

    <!-- ════════════════════════════
         BARRA DE FILTROS
    ════════════════════════════ -->
    <div class="filters-bar">

      <!-- Categorías -->
      <div class="cat-filters">
        <button
          v-for="cat in categories"
          :key="cat.value"
          :class="['cat-btn', { active: activeCategory === cat.value }]"
          @click="selectCategory(cat.value)"
        >
          <component :is="cat.icon" :size="14" stroke-width="1.5" />
          {{ cat.label }}
        </button>
      </div>


    </div>

    <!-- ════════════════════════════
         LOADING INICIAL
    ════════════════════════════ -->
    <div v-if="productsStore.loading && productsStore.items.length === 0" class="loading-state">
      <div class="spinner" />
      <span>{{ t('products.loading') }}</span>
    </div>

    <!-- ERROR -->
    <div v-else-if="productsStore.error" class="alert-error">{{ productsStore.error }}</div>

    <!-- SIN RESULTADOS -->
    <div v-else-if="sortedItems.length === 0 && !productsStore.loading" class="empty-state">
      <PackageSearch :size="52" stroke-width="1" />
      <p>{{ productsStore.search ? `${t('products.empty.q')} "${productsStore.search}"` : t('products.empty') }}</p>
      <button class="btn-ghost" @click="clearFilters">{{ t('products.clear') }}</button>
    </div>

    <!-- ════════════════════════════
         GRID
    ════════════════════════════ -->
    <div v-else class="products-grid-wrap" :class="{ 'is-paging': productsStore.transitioning }">
      <div v-if="productsStore.transitioning" class="grid-paging-overlay">
        <span class="grid-spinner"><Loader2 :size="30" class="spin" /></span>
      </div>
      <div class="products-grid" ref="gridRef">
        <ProductCard
          v-for="product in sortedItems"
          :key="product.id"
          :product="product"
          @add-to-cart="handleAddToCart"
        />
      </div>
    </div>

    <!-- ════════════════════════════
         PAGINACIÓN
    ════════════════════════════ -->
    <div v-if="sortedItems.length > 0" class="pagination-section">

      <p class="pg-range">
        {{ productsStore.rangeStart }}–{{ productsStore.rangeEnd }}
        {{ t('products.of') }} <strong>{{ productsStore.totalCount }}</strong> {{ t('products.results') }}
      </p>

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
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, X, Layers, CircleDot, Footprints, Shirt, Watch, Bike,
  PackageSearch, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-vue-next'
import { useProductsStore } from '@/stores/products'
import { useCartStore }     from '@/stores/cart'
import { useAuthStore }     from '@/stores/auth'
import { useReveal }        from '@/composables/useReveal'
import { useLocaleStore }   from '@/stores/locale'
import gsap from 'gsap'
import ProductCard from '@/components/ProductCard.vue'

const router        = useRouter()
const productsStore = useProductsStore()
const cartStore     = useCartStore()
const authStore     = useAuthStore()
const localeStore   = useLocaleStore()
const t = (key) => localeStore.t(key)
const gridRef       = ref(null)

const activeCategory = ref(productsStore.category || '')

const categories = computed(() => [
  { value: '',           label: t('cat.all'),        icon: Layers     },
  { value: 'futbol',     label: t('cat.futbol'),     icon: CircleDot  },
  { value: 'calzado',    label: t('cat.calzado'),    icon: Footprints },
  { value: 'ropa',       label: t('cat.ropa'),       icon: Shirt      },
  { value: 'accesorios', label: t('cat.accesorios'), icon: Watch      },
  { value: 'tenis',      label: t('cat.tenis'),      icon: CircleDot  },
  { value: 'ciclismo',   label: t('cat.ciclismo'),   icon: Bike       },
])

const activeCatLabel = computed(() => categories.value.find(c => c.value === activeCategory.value)?.label ?? '')
const activeCatIcon  = computed(() => categories.value.find(c => c.value === activeCategory.value)?.icon ?? Layers)

const sortedItems = computed(() => {
  const items = [...productsStore.filteredItems]
  if (productsStore.sortBy === 'price-asc')  return items.sort((a, b) => a.price - b.price)
  if (productsStore.sortBy === 'price-desc') return items.sort((a, b) => b.price - a.price)
  if (productsStore.sortBy === 'name-asc')   return items.sort((a, b) => a.name?.localeCompare(b.name))
  return items
})

// ── Lifecycle ──
onMounted(() => {
  if (productsStore.items.length === 0) {
    productsStore.fetchProducts({ category: activeCategory.value, limit: 10 })
  }
})
useReveal()

// Stagger GSAP en el grid cuando cambian los items (paginación o filtros)
watch(() => productsStore.items, async () => {
  await nextTick()
  const cards = gridRef.value?.querySelectorAll('.product-card')
  if (!cards?.length) return
  gsap.fromTo(
    cards,
    { opacity: 0, y: 22, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.42, stagger: 0.055, ease: 'power3.out' }
  )
})

// ── Acciones ──
const selectCategory = (cat) => {
  activeCategory.value = cat
  productsStore.fetchProducts({
    category: cat,
    limit: 10,
    minPrice: productsStore.minPriceInput || null,
    maxPrice: productsStore.maxPriceInput || null,
  })
}

const clearPrice = () => {
  productsStore.minPriceInput = ''
  productsStore.maxPriceInput = ''
  productsStore.fetchProducts({ category: activeCategory.value, limit: 10, minPrice: null, maxPrice: null })
}

const clearFilters = () => {
  productsStore.search        = ''
  productsStore.minPriceInput = ''
  productsStore.maxPriceInput = ''
  productsStore.sortBy        = ''
  selectCategory('')
}

const handleAddToCart = async (product) => {
  if (!authStore.isAuthenticated) { router.push({ name: 'login' }); return }
  try { await cartStore.addItem(product, 1) } catch { /* en store */ }
}
</script>

<style scoped>
/* ── Layout ── */
.products-page { max-width: 1200px; margin: 0 auto; }

/* ── Cabecera ── */
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.page-head-left h2 { margin: 0 0 0.3rem; font-size: 1.4rem; }
.page-subtitle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  flex-wrap: wrap;
  margin: 0;
}

/* Pills de filtros activos */
.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: var(--color-primary);
  border-radius: 2rem;
  padding: 0.15rem 0.5rem 0.15rem 0.45rem;
  font-size: 0.75rem;
  font-weight: 500;
}
.filter-pill button {
  background: none; border: none; cursor: pointer; padding: 0;
  display: flex; color: inherit; opacity: 0.7; line-height: 1;
}
.filter-pill button:hover { opacity: 1; }
.price-pill  { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
.search-pill { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }

/* Ordenar */
.sort-wrap {
  display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
  color: var(--color-text-muted);
}
.sort-select {
  padding: 0.38rem 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text);
  background: var(--color-surface);
  cursor: pointer; outline: none;
  transition: border-color 0.15s;
}
.sort-select:focus { border-color: var(--color-primary); }

/* ── Barra de filtros ── */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.5rem;
  padding: 0.875rem 1.1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

/* Categorías */
.cat-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  flex: 1;
}
.cat-btn {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.38rem 0.8rem;
  border: 1.5px solid var(--color-border);
  border-radius: 2rem;
  background: transparent;
  font-size: 0.82rem; font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: #eff6ff; }
.cat-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }

/* Precio */
.price-filter {
  display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;
}
.price-icon { color: var(--color-text-muted); }
.price-label { font-size: 0.82rem; color: var(--color-text-muted); font-weight: 500; white-space: nowrap; }
.price-input {
  width: 72px;
  padding: 0.35rem 0.5rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.4rem;
  font-size: 0.82rem;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.15s;
  -moz-appearance: textfield;
}
.price-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.price-input:focus { border-color: var(--color-primary); }
.price-sep { color: var(--color-text-muted); font-size: 0.85rem; }
.btn-apply-price {
  padding: 0.35rem 0.75rem;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-apply-price:hover { background: var(--color-primary-h, #1d4ed8); }

/* ── Loading ── */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem; padding: 4rem 0;
  color: var(--color-text-muted); font-size: 0.9rem;
}
.spinner {
  width: 28px; height: 28px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Empty ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem; padding: 4rem 0 3rem;
  color: var(--color-text-muted);
}
.empty-state svg { opacity: 0.3; }
.empty-state p { margin: 0; font-size: 0.95rem; text-align: center; }
.btn-ghost {
  padding: 0.45rem 1.1rem;
  border: 1.5px solid var(--color-border);
  border-radius: 0.5rem; background: transparent;
  color: var(--color-text-muted); font-size: 0.85rem;
  cursor: pointer; transition: all 0.15s;
}
.btn-ghost:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* ── Grid ── */
.products-grid-wrap { position: relative; }
.is-paging .products-grid {
  opacity: 0.2;
  pointer-events: none;
  transition: opacity 0.2s;
}
.grid-paging-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 3rem;
}
.grid-spinner {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  padding: 0.65rem;
  display: flex;
  box-shadow: 0 4px 20px rgba(0,0,0,.08);
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

/* ── Paginación ── */
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
.spin { animation: spin 0.7s linear infinite; }

/* ── Alert ── */
.alert-error {
  padding: 1rem; background: #fef2f2;
  color: #b91c1c; border-radius: 0.5rem; font-size: 0.875rem;
}
</style>
