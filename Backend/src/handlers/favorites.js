const favoritesService = require('../services/favoritesService');
const productService = require('../services/productService');
const { requireAuth, getPathParam, ok, fail, handleError } = require('../utils/lambda');

/**
 * GET /favorites  — lista favoritos del usuario
 */
module.exports.getFavorites = async (event) => {
  try {
    const user      = requireAuth(event);
    const favorites = await favoritesService.getFavorites(user.id);
    return ok(favorites, 'Favoritos obtenidos.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * POST /favorites/{productId}  — agrega a favoritos
 */
module.exports.addFavorite = async (event) => {
  try {
    const user      = requireAuth(event);
    const productId = getPathParam(event, 'productId');
    const product   = await productService.getProductById(productId);
    if (!product) return fail('Producto no encontrado.', 404);
    const item = await favoritesService.addFavorite(user.id, product);
    return ok(item, 'Agregado a favoritos.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * DELETE /favorites/{productId}  — elimina de favoritos
 */
module.exports.removeFavorite = async (event) => {
  try {
    const user      = requireAuth(event);
    const productId = getPathParam(event, 'productId');
    await favoritesService.removeFavorite(user.id, productId);
    return ok(null, 'Eliminado de favoritos.');
  } catch (err) {
    return handleError(err, event);
  }
};
