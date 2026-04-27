import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user:  JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await authApi.register(payload)
        this._saveSession(data.data)
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al registrarse.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async login(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await authApi.login(payload)
        this._saveSession(data.data)
      } catch (err) {
        this.error = err.response?.data?.message || 'Credenciales inválidas.'
        throw err
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user  = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Limpiar stores dependientes del usuario
      // Se importan dinámicamente para evitar dependencias circulares
      import('./cart').then(m => m.useCartStore().clearLocalCart())
      import('./favorites').then(m => m.useFavoritesStore().clearLocal())
      import('./orders').then(m => m.useOrdersStore().clearLocal())
    },

    _saveSession({ user, token }) {
      this.user  = user
      this.token = token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
  },
})
