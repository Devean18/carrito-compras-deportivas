const orderService = require('../services/orderService');
const {
  getPathParam,
  requireAuth, ok, created, fail, handleError,
} = require('../utils/lambda');

/**
 * POST /orders/checkout  — protegido
 */
module.exports.checkout = async (event) => {
  try {
    const user = requireAuth(event);
    const order = await orderService.checkout(user.id, user.email);
    return created(order, 'Compra realizada exitosamente.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * GET /orders  — protegido
 */
module.exports.getOrders = async (event) => {
  try {
    const user = requireAuth(event);
    const orders = await orderService.getOrdersByUser(user.id);
    return ok(orders, 'Historial de órdenes obtenido.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * PATCH /orders/{id}/cancel  — protegido
 */
module.exports.cancelOrder = async (event) => {
  try {
    const user = requireAuth(event);
    const id = getPathParam(event, 'id');
    const order = await orderService.cancelOrder(id, user.id);
    return ok(order, 'Orden cancelada exitosamente.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * GET /orders/{id}  — protegido
 */
module.exports.getOrderById = async (event) => {
  try {
    const user = requireAuth(event);
    const id = getPathParam(event, 'id');
    const order = await orderService.getOrderById(id);
    if (!order) return fail('Orden no encontrada.', 404);
    if (order.userId !== user.id) return fail('No tienes acceso a esta orden.', 403);
    return ok(order, 'Orden obtenida.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * DELETE /orders/{id}  — protegido, solo órdenes canceladas
 */
module.exports.deleteOrder = async (event) => {
  try {
    const user = requireAuth(event);
    const id = getPathParam(event, 'id');
    await orderService.deleteOrder(id, user.id);
    return ok(null, 'Orden eliminada.');
  } catch (err) {
    return handleError(err, event);
  }
};
