const cartService = require('../services/cartService');
const {
  parseBody, getPathParam,
  requireAuth, ok, fail, handleError,
} = require('../utils/lambda');

/**
 * GET /cart  — protegido
 */
module.exports.getCart = async (event) => {
  try {
    const user = requireAuth(event);
    const cart = await cartService.getCart(user.id);
    return ok(cart, 'Carrito obtenido.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * POST /cart/add  — protegido
 */
module.exports.addToCart = async (event) => {
  try {
    const user = requireAuth(event);
    const { productId, quantity } = parseBody(event);

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      return fail('El productId es requerido y debe ser un string válido.', 400);
    }

    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      return fail('La cantidad debe ser un número entero mayor a 0.', 400);
    }

    const cart = await cartService.addToCart(user.id, productId, qty);
    return ok(cart, 'Producto agregado al carrito.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * DELETE /cart/{productId}  — protegido
 */
module.exports.removeFromCart = async (event) => {
  try {
    const user = requireAuth(event);
    const productId = getPathParam(event, 'productId');
    const cart = await cartService.removeFromCart(user.id, productId);
    return ok(cart, 'Producto eliminado del carrito.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * PUT /cart/{productId}  — protegido
 */
module.exports.updateCartItem = async (event) => {
  try {
    const user = requireAuth(event);
    const productId = getPathParam(event, 'productId');
    const { quantity } = parseBody(event);

    if (!productId || productId.trim() === '') {
      return fail('El productId es requerido.', 400);
    }

    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 0) {
      return fail('La cantidad debe ser un número entero mayor o igual a 0.', 400);
    }

    const cart = await cartService.updateCartItem(user.id, productId, qty);
    return ok(cart, 'Cantidad actualizada.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * DELETE /cart  — protegido
 */
module.exports.clearCart = async (event) => {
  try {
    const user = requireAuth(event);
    const cart = await cartService.clearCart(user.id);
    return ok(cart, 'Carrito vaciado.');
  } catch (err) {
    return handleError(err, event);
  }
};
