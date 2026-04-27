import { defineStore } from 'pinia'
import * as ordersApi from '@/api/orders'

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders:  [],
    loading: false,
    error:   null,
  }),

  getters: {
    activeCount: (state) =>
      state.orders.filter((o) => o.status !== 'cancelled').length,
  },

  actions: {
    async fetchOrders() {
      if (this.orders.length === 0) this.loading = true
      this.error = null
      try {
        const { data } = await ordersApi.getOrders()
        const fresh = data.data || []

        // Actualizar en lugar de reemplazar para no destruir nodos del DOM
        // (evita que GSAP re-anime todas las tarjetas)
        const freshIds = new Set(fresh.map(o => o.id))
        this.orders = this.orders.filter(o => freshIds.has(o.id))

        for (const order of fresh) {
          const idx = this.orders.findIndex(o => o.id === order.id)
          if (idx >= 0) Object.assign(this.orders[idx], order)
          else this.orders.push(order)
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar pedidos.'
      } finally {
        this.loading = false
      }
    },

    async cancelOrder(id) {
      const idx = this.orders.findIndex(o => o.id === id)
      if (idx === -1) return

      const originalStatus = this.orders[idx].status
      this.orders[idx].status = 'cancelled'

      try {
        const { data } = await ordersApi.cancelOrder(id)
        Object.assign(this.orders[idx], data.data)
      } catch (err) {
        this.orders[idx].status = originalStatus
        throw err
      }
    },

    async removeOrder(id) {
      const backup = [...this.orders]
      this.orders = this.orders.filter(o => o.id !== id)

      try {
        await ordersApi.deleteOrder(id)
      } catch (err) {
        this.orders = backup
        throw err
      }
    },

    clearLocal() {
      this.orders = []
    },
  },
})
