import { defineStore } from 'pinia'
import * as productsApi from '@/api/products'

export const useProductsStore = defineStore('products', {
  state: () => ({
    items:         [],
    loading:       false,
    transitioning: false,
    error:         null,
    currentPage:   1,
    totalCount:    0,
    limit:         10,
    // historial de cursores: cursorHistory[n] = lastKey para cargar la página n+1
    cursorHistory: [null],
    // caché de páginas ya cargadas: { [page]: { items, totalCount, nextKey } }
    pageCache:     {},
    // filtros activos
    category:      '',
    minPrice:      null,
    maxPrice:      null,
    search:        '',
    sortBy:        '',
    minPriceInput: '',
    maxPriceInput: '',
  }),

  getters: {
    filteredItems: (state) => {
      const q = state.search.trim().toLowerCase()
      if (!q) return state.items
      return state.items.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      )
    },
    totalPages: (state) => {
      if (!state.totalCount) return state.cursorHistory.length
      return Math.ceil(state.totalCount / state.limit)
    },
    rangeStart: (state) => (state.currentPage - 1) * state.limit + 1,
    rangeEnd:   (state) => Math.min(state.currentPage * state.limit, state.totalCount || state.currentPage * state.limit),
  },

  actions: {
    // ── Construcción de params compartidos ──
    _buildParams(page) {
      const lastKey = this.cursorHistory[page - 1] ?? null
      const params  = { limit: this.limit }
      if (this.category) params.category = this.category
      if (lastKey)       params.lastKey  = lastKey
      if (this.minPrice !== null && this.minPrice !== '') params.minPrice = this.minPrice
      if (this.maxPrice !== null && this.maxPrice !== '') params.maxPrice = this.maxPrice
      return params
    },

    // ── Carga inicial (nueva búsqueda / filtro) — siempre limpia caché ──
    async fetchProducts({ category = '', limit = 10, minPrice = null, maxPrice = null } = {}) {
      this.loading  = true
      this.error    = null
      this.pageCache = {}   // invalidar caché completa al cambiar filtros
      try {
        const params = { limit }
        if (category) params.category = category
        if (minPrice !== null && minPrice !== '') params.minPrice = minPrice
        if (maxPrice !== null && maxPrice !== '') params.maxPrice = maxPrice

        const { data } = await productsApi.getProducts(params)

        this.items         = data.data
        this.totalCount    = data.meta?.totalCount || 0
        this.currentPage   = 1
        this.category      = category
        this.limit         = limit
        this.minPrice      = minPrice
        this.maxPrice      = maxPrice
        this.cursorHistory = [null]
        if (data.meta?.nextKey) this.cursorHistory.push(data.meta.nextKey)

        // Guardar en caché y prefetch página 2 en segundo plano
        this.pageCache[1] = { items: data.data, totalCount: this.totalCount }
        this._prefetch(2)
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar productos.'
      } finally {
        this.loading = false
      }
    },

    // ── Navegar a una página con caché ──
    async goToPage(page) {
      if (page < 1 || (this.totalPages && page > this.totalPages)) return
      if (page === this.currentPage) return

      // HIT de caché → instantáneo, sin spinner
      if (this.pageCache[page]) {
        const cached = this.pageCache[page]
        this.items       = cached.items
        this.currentPage = page
        if (cached.totalCount) this.totalCount = cached.totalCount
        // Prefetch silencioso de la siguiente página
        this._prefetch(page + 1)
        return
      }

      // MISS → fetch normal con indicador de transición
      this.transitioning = this.items.length > 0
      this.loading       = true
      this.error         = null
      try {
        const params = this._buildParams(page)
        const { data } = await productsApi.getProducts(params)

        this.items       = data.data
        this.currentPage = page
        if (data.meta?.totalCount) this.totalCount = data.meta.totalCount

        // Guardar cursor de la siguiente página
        if (data.meta?.nextKey && !this.cursorHistory[page]) {
          this.cursorHistory[page] = data.meta.nextKey
        }

        // Guardar en caché
        this.pageCache[page] = { items: data.data, totalCount: this.totalCount }

        // Prefetch silencioso de la siguiente página
        this._prefetch(page + 1)
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar productos.'
      } finally {
        this.loading       = false
        this.transitioning = false
      }
    },

    // ── Prefetch silencioso de una página futura ──
    async _prefetch(page) {
      // No prefetch si: ya está cacheada, ya no hay más páginas, o no tenemos el cursor
      if (this.pageCache[page]) return
      if (this.totalPages && page > this.totalPages) return
      if (!this.cursorHistory[page - 1] && page > 1) return  // cursor aún no disponible

      try {
        const params = this._buildParams(page)
        const { data } = await productsApi.getProducts(params)

        // Guardar cursor de la siguiente página
        if (data.meta?.nextKey && !this.cursorHistory[page]) {
          this.cursorHistory[page] = data.meta.nextKey
        }
        if (data.meta?.totalCount) this.totalCount = data.meta.totalCount

        // Guardar en caché sin tocar el estado visible
        this.pageCache[page] = { items: data.data, totalCount: this.totalCount }
      } catch {
        // Prefetch fallido es silencioso; el usuario simplemente verá el spinner normal
      }
    },

    nextPage() { this.goToPage(this.currentPage + 1) },
    prevPage() { this.goToPage(this.currentPage - 1) },
  },
})
