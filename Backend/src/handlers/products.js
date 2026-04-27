const productService = require('../services/productService');
const {
  parseBody, getPathParam, getQueryParam,
  requireAuth, ok, created, fail, handleError,
} = require('../utils/lambda');

/**
 * GET /products  — público, con paginación y filtro por categoría
 */
module.exports.getProducts = async (event) => {
  try {
    const category = getQueryParam(event, 'category');
    const limit    = getQueryParam(event, 'limit');
    const lastKey  = getQueryParam(event, 'lastKey');
    const minPrice = getQueryParam(event, 'minPrice');
    const maxPrice = getQueryParam(event, 'maxPrice');

    const result = await productService.getProducts({ category, limit, lastKey, minPrice, maxPrice });
    return ok(result.items, 'Productos obtenidos.', {
      count: result.count,
      nextKey: result.nextKey,
      totalCount: result.totalCount,
    });
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * GET /products/{id}  — público
 */
module.exports.getProductById = async (event) => {
  try {
    const id = getPathParam(event, 'id');
    const product = await productService.getProductById(id);
    if (!product) return fail('Producto no encontrado.', 404);
    return ok(product, 'Producto obtenido.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * POST /products  — protegido
 */
module.exports.createProduct = async (event) => {
  try {
    requireAuth(event);

    const { name, category, price, stock, imageUrl } = parseBody(event);

    if (!name || !category || price === undefined || stock === undefined) {
      return fail('Campos requeridos: name, category, price, stock', 400)
    }
    if (typeof price !== 'number' || price <= 0) {
      return fail('El precio debe ser un número positivo.', 400)
    }
    if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
      return fail('El stock debe ser un número entero no negativo.', 400)
    }

    const product = await productService.createProduct({ name, category, price, stock, imageUrl });
    return created(product, 'Producto creado exitosamente.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * PUT /products/{id}  — protegido
 */
module.exports.updateProduct = async (event) => {
  try {
    requireAuth(event);
    const id = getPathParam(event, 'id');
    const body = parseBody(event);
    const product = await productService.updateProduct(id, body);
    return ok(product, 'Producto actualizado.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * DELETE /products/{id}  — protegido
 */
module.exports.deleteProduct = async (event) => {
  try {
    requireAuth(event);
    const id = getPathParam(event, 'id');
    await productService.deleteProduct(id);
    return ok(null, 'Producto eliminado.');
  } catch (err) {
    return handleError(err, event);
  }
};
