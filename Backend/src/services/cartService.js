const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { documentClient, TABLES } = require('../config/dynamodb');
const { getProductById } = require('./productService');
const logger = require('../config/logger');

const calculateCartTotals = (items) => {
  if (!items?.length) return { total: 0, totalItems: 0 };
  const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  return { total: Math.round(total * 100) / 100, totalItems };
};

/**
 * Obtiene el carrito del usuario (o crea uno vacío).
 * SIEMPRE recalcula totales desde los items.
 */
const getCart = async (userId) => {
  const result = await documentClient.send(new GetCommand({ 
    TableName: TABLES.CARTS, 
    Key: { userId } 
  }));
  
  let cart = result.Item || { userId, items: [] };

  if (!Array.isArray(cart.items)) {
    cart.items = [];
  }

  const { total, totalItems } = calculateCartTotals(cart.items);
  cart.total = total;
  cart.totalItems = totalItems;
  cart.updatedAt = cart.updatedAt || new Date().toISOString();
  
  return cart;
};

/**
 * Agrega un producto al carrito del usuario.
 * Atómico: valida todo antes de hacer cambios.
 */
const addToCart = async (userId, productId, quantity) => {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
    const error = new Error('Cantidad inválida. Debe ser un entero mayor a 0.');
    error.statusCode = 400;
    throw error;
  }

  const product = await getProductById(productId);
  if (!product) {
    const error = new Error('Producto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const cart = await getCart(userId);
  const existingIndex = cart.items.findIndex((i) => i.productId === productId);
  const currentQty = existingIndex >= 0 ? cart.items[existingIndex].quantity : 0;
  const newQty = currentQty + quantity;

  if (newQty > product.stock) {
    const error = new Error(`Stock insuficiente. Disponible: ${product.stock}`);
    error.statusCode = 400;
    throw error;
  }

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity = newQty;
    cart.items[existingIndex].subtotal = newQty * product.price;
  } else {
    cart.items.push({
      productId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: newQty,
      subtotal: newQty * product.price,
    });
  }

  const { total, totalItems } = calculateCartTotals(cart.items);
  cart.total = total;
  cart.totalItems = totalItems;
  cart.updatedAt = new Date().toISOString();

  await documentClient.send(new PutCommand({ TableName: TABLES.CARTS, Item: cart }));
  logger.info('Producto agregado al carrito', { userId, productId, quantity: newQty, totalItems });
  return cart;
};

/**
 * Elimina un producto del carrito.
 */
const removeFromCart = async (userId, productId) => {
  const cart = await getCart(userId);
  const index = cart.items.findIndex((i) => i.productId === productId);

  if (index === -1) {
    const error = new Error('El producto no está en el carrito.');
    error.statusCode = 404;
    throw error;
  }

  cart.items.splice(index, 1);

  const { total, totalItems } = calculateCartTotals(cart.items);
  cart.total = total;
  cart.totalItems = totalItems;
  cart.updatedAt = new Date().toISOString();

  await documentClient.send(new PutCommand({ TableName: TABLES.CARTS, Item: cart }));
  logger.info('Producto eliminado del carrito', { userId, productId, totalItems });
  return cart;
};

/**
 * Vacía el carrito del usuario.
 */
const clearCart = async (userId) => {
  const cart = { 
    userId, 
    items: [], 
    total: 0, 
    totalItems: 0,
    updatedAt: new Date().toISOString() 
  };
  
  await documentClient.send(new PutCommand({ 
    TableName: TABLES.CARTS, 
    Item: cart 
  }));
  
  logger.info('Carrito vaciado', { userId });
  return cart;
};

/**
 * Actualiza la cantidad de un producto en el carrito.
 * Cantidad 0 elimina el item. Atómico: valida stock antes de cambiar.
 */
const updateCartItem = async (userId, productId, quantity) => {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
    const error = new Error('Cantidad inválida. Debe ser un entero no negativo.');
    error.statusCode = 400;
    throw error;
  }

  if (quantity === 0) return removeFromCart(userId, productId);

  const product = await getProductById(productId);
  if (!product) {
    const error = new Error('Producto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  if (quantity > product.stock) {
    const error = new Error(`Stock insuficiente. Disponible: ${product.stock}`);
    error.statusCode = 400;
    throw error;
  }

  const cart = await getCart(userId);
  const index = cart.items.findIndex((i) => i.productId === productId);

  if (index === -1) {
    const error = new Error('El producto no está en el carrito.');
    error.statusCode = 404;
    throw error;
  }

  cart.items[index].quantity = quantity;
  cart.items[index].subtotal = quantity * product.price;

  const { total, totalItems } = calculateCartTotals(cart.items);
  cart.total = total;
  cart.totalItems = totalItems;
  cart.updatedAt = new Date().toISOString();

  await documentClient.send(new PutCommand({ TableName: TABLES.CARTS, Item: cart }));
  logger.info('Cantidad actualizada en carrito', { userId, productId, quantity, totalItems });
  return cart;
};

module.exports = { getCart, addToCart, removeFromCart, clearCart, updateCartItem };
