import { defineStore } from 'pinia'
import * as favoritesApi from '@/api/favorites'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    items:   [],   // lista de { userId, productId, name, price, imageUrl, category }
    loading: false,
    error:   null,
  }),

  getters: {
    count: (state) => state.items.length,
    ids:   (state) => new Set(state.items.map((i) => i.productId)),
    isFavorite: (state) => (productId) =>
      state.items.some((i) => i.productId === productId),
  },

  actions: {
    // Cache-first: si ya hay datos los muestra de inmediato y refresca en segundo plano
    async fetchFavorites() {
      if (this.items.length === 0) this.loading = true
      this.error = null
      try {
        const { data } = await favoritesApi.getFavorites()
        this.items = data.data || []
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar favoritos.'
      } finally {
        this.loading = false
      }
    },

    // Actualización optimista: UI cambia al instante, revierte si falla la API
    async toggle(product) {
      if (this.isFavorite(product.id)) {
        const backup = [...this.items]
        this.items = this.items.filter((i) => i.productId !== product.id)
        try {
          await favoritesApi.removeFavorite(product.id)
        } catch (err) {
          this.items = backup
          this.error = err.response?.data?.message || 'Error al eliminar favorito.'
        }
      } else {
        const placeholder = {
          productId: product.id,
          name:      product.name,
          price:     product.price,
          imageUrl:  product.imageUrl,
          category:  product.category,
        }
        this.items.push(placeholder)
        try {
          const { data } = await favoritesApi.addFavorite(product.id)
          const idx = this.items.findIndex((i) => i.productId === product.id)
          if (idx !== -1) this.items[idx] = data.data
        } catch (err) {
          this.items = this.items.filter((i) => i.productId !== product.id)
          this.error = err.response?.data?.message || 'Error al agregar favorito.'
        }
      }
    },

    async add(productId) {
      try {
        const { data } = await favoritesApi.addFavorite(productId)
        if (!this.isFavorite(productId)) this.items.push(data.data)
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al agregar favorito.'
      }
    },

    // Optimista también para remove individual (usado en FavoritesView)
    async remove(productId) {
      const backup = [...this.items]
      this.items = this.items.filter((i) => i.productId !== productId)
      try {
        await favoritesApi.removeFavorite(productId)
      } catch (err) {
        this.items = backup
        this.error = err.response?.data?.message || 'Error al eliminar favorito.'
      }
    },

    clearLocal() {
      this.items = []
    },
  },
})
