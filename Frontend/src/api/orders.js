import api from './axios'

export const checkout     = ()    => api.post('/orders/checkout')
export const getOrders    = ()    => api.get('/orders')
export const getOrderById = (id)  => api.get(`/orders/${id}`)
export const cancelOrder  = (id)  => api.patch(`/orders/${id}/cancel`)
export const deleteOrder  = (id)  => api.delete(`/orders/${id}`)
