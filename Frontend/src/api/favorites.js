import api from './axios'

export const getFavorites   = ()           => api.get('/favorites')
export const addFavorite    = (productId)  => api.post(`/favorites/${productId}`)
export const removeFavorite = (productId)  => api.delete(`/favorites/${productId}`)
