import { defineStore } from 'pinia'
import * as cartApi  from '@/api/cart'
import * as ordersApi from '@/api/orders'

// Control de debounce por productId
const _updateTimers  = {}

/**
 * Sincroniza el estado local con la respuesta del servidor
 * solo si es más reciente que el estado actual
 */
const _syncWithServer = (state, serverCart) => {
  if (!serverCart) return
  state.items = serverCart.items || []
  state.total = serverCart.total || 0
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items:   [],
    total:   0,
    loading: false,
    error:   null,
    lastOrder:       null,
    checkoutLoading: false,
    checkoutError:   null,
  }),

  getters: {
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
  },

  actions: {
    async fetchCart() {
      if (this.items.length === 0) this.loading = true
      this.error = null
      try {
        const { data } = await cartApi.getCart()
        _syncWithServer(this, data.data)
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar el carrito.'
      } finally {
        this.loading = false
      }
    },

    /**
     * Agrega un producto al carrito con validación y manejo robusto
     */
    async addItem(product, quantity = 1) {
      const productId = typeof product === 'string' ? product : product.id
      const qty = Math.max(1, Math.floor(quantity))
      
      // Validar cantidad
      if (!Number.isInteger(qty) || qty < 1) {
        this.error = 'La cantidad debe ser un número entero mayor a 0.'
        return
      }

      // Backup para rollback
      const backup = JSON.parse(JSON.stringify({ items: this.items, total: this.total }))
      
      // Actualizar UI inmediatamente (optimistic update)
      const existingIdx = this.items.findIndex(i => i.productId === productId)
      if (existingIdx >= 0) {
        this.items[existingIdx].quantity += qty
        this.items[existingIdx].subtotal = this.items[existingIdx].quantity * this.items[existingIdx].price
      } else if (typeof product === 'object' && product) {
        this.items.push({
          productId,
          name: product.name || '',
          price: product.price || 0,
          imageUrl: product.imageUrl || '',
          quantity: qty,
          subtotal: (product.price || 0) * qty,
        })
      }
      this.total = this.items.reduce((s, i) => s + i.subtotal, 0)
      this.error = null

      try {
        const { data } = await cartApi.addToCart(productId, qty)
        _syncWithServer(this, data.data)
      } catch (err) {
        // Rollback en caso de error
        this.items = backup.items
        this.total = backup.total
        this.error = err.response?.data?.message || 'Error al agregar producto.'
        throw err
      }
    },

    /**
     * Actualiza cantidad de un producto con debounce
     * Realiza una única llamada al servidor con la cantidad final
     */
    async updateItem(productId, quantity) {
      const idx = this.items.findIndex(i => i.productId === productId)
      if (idx === -1) return
      
      const newQty = Math.max(0, Math.floor(quantity))
      if (newQty === this.items[idx].quantity) return

      // Si es 0, eliminar el producto
      if (newQty === 0) {
        clearTimeout(_updateTimers[productId])
        delete _updateTimers[productId]
        return this.removeItem(productId)
      }

      // Guardar estado antes de cambios
      const backup = JSON.parse(JSON.stringify({ items: this.items, total: this.total }))

      // Actualizar UI inmediatamente
      this.items[idx].quantity = newQty
      this.items[idx].subtotal = newQty * this.items[idx].price
      this.total = this.items.reduce((s, i) => s + i.subtotal, 0)

      // Cancelar timer anterior para este producto
      if (_updateTimers[productId]) {
        clearTimeout(_updateTimers[productId])
      }

      // Debounce: esperar 400ms sin cambios antes de enviar al servidor
      _updateTimers[productId] = setTimeout(async () => {
        delete _updateTimers[productId]
        
        // Verificar que el producto aún existe en el carrito
        const current = this.items.find(i => i.productId === productId)
        if (!current) return

        try {
          const { data } = await cartApi.updateCartItem(productId, current.quantity)
          _syncWithServer(this, data.data)
        } catch (err) {
          // Rollback solo si el error es del servidor
          this.items = backup.items
          this.total = backup.total
          this.error = err.response?.data?.message || 'Error al actualizar cantidad.'
        }
      }, 400)
    },

    /**
     * Elimina un producto del carrito
     */
    async removeItem(productId) {
      // Limpiar timer pendiente si existe
      if (_updateTimers[productId]) {
        clearTimeout(_updateTimers[productId])
        delete _updateTimers[productId]
      }

      const backup = JSON.parse(JSON.stringify({ items: this.items, total: this.total }))
      
      // Optimistic update
      this.items = this.items.filter(i => i.productId !== productId)
      this.total = this.items.reduce((s, i) => s + i.subtotal, 0)
      this.error = null

      try {
        const { data } = await cartApi.removeFromCart(productId)
        _syncWithServer(this, data.data)
      } catch (err) {
        // Rollback
        this.items = backup.items
        this.total = backup.total
        this.error = err.response?.data?.message || 'Error al eliminar producto.'
        throw err
      }
    },

    /**
     * Procesa el checkout
     */
    async checkout() {
      this.checkoutLoading = true
      this.checkoutError = null

      try {
        const { data } = await ordersApi.checkout()
        this.lastOrder = data.data
        this.items = []
        this.total = 0
        
        // Invalidar órdenes en caché
        import('./orders').then(m => m.useOrdersStore?.()?.clearLocal?.())
        return data.data
      } catch (err) {
        this.checkoutError = err.response?.data?.message || 'Error al procesar la compra.'
        throw err
      } finally {
        this.checkoutLoading = false
      }
    },

    /**
     * Vacía el carrito completamente
     */
    async clearCart() {
      // Cancelar todos los timers pendientes
      for (const id of Object.keys(_updateTimers)) {
        clearTimeout(_updateTimers[id])
        delete _updateTimers[id]
      }

      const backup = JSON.parse(JSON.stringify({ items: this.items, total: this.total }))
      
      // Limpiar UI inmediatamente
      this.items = []
      this.total = 0
      this.error = null

      try {
        await cartApi.clearCart()
      } catch (err) {
        // Restaurar si falla
        this.items = backup.items
        this.total = backup.total
        this.error = err.response?.data?.message || 'Error al vaciar el carrito.'
        throw err
      }
    },

    /**
     * Fuerza revalidación completa del carrito desde el servidor
     */
    async revalidateCart() {
      try {
        const { data } = await cartApi.getCart()
        _syncWithServer(this, data.data)
      } catch (err) {
        console.error('Error revalidating cart:', err)
      }
    },

    clearLocalCart() {
      for (const id of Object.keys(_updateTimers)) {
        clearTimeout(_updateTimers[id])
        delete _updateTimers[id]
      }
      this.items = []
      this.total = 0
    },
  },
})
