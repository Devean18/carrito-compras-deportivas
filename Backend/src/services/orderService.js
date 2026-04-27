const { v4: uuidv4 } = require('uuid');
const { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { documentClient, TABLES } = require('../config/dynamodb');
const { getCart, clearCart } = require('./cartService');
const { getProductById, decrementStock } = require('./productService');
const { sendOrderConfirmation } = require('./emailService');
const logger = require('../config/logger');

/**
 * Procesa el checkout: valida stock, crea la orden, reduce stock y vacía el carrito.
 */
const checkout = async (userId, userEmail) => {
  const cart = await getCart(userId);

  if (!cart.items || cart.items.length === 0) {
    logger.warn('Checkout bloqueado: carrito vacío', { userId });
    const error = new Error('El carrito está vacío.');
    error.statusCode = 400;
    throw error;
  }

  const itemsWithCurrentPrices = await Promise.all(
    cart.items.map(async (item) => {
      const product = await getProductById(item.productId);
      if (!product) {
        logger.warn('Checkout bloqueado: producto no disponible', { userId, productName: item.name });
        const error = new Error(`El producto "${item.name}" ya no está disponible.`);
        error.statusCode = 400;
        throw error;
      }
      if (product.stock < item.quantity) {
        logger.warn('Checkout bloqueado: stock insuficiente', { userId, productName: product.name, available: product.stock, requested: item.quantity });
        const error = new Error(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}.`
        );
        error.statusCode = 400;
        throw error;
      }
      return {
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
        imageUrl: product.imageUrl,
      };
    })
  );

  const total = itemsWithCurrentPrices.reduce((sum, item) => sum + item.subtotal, 0);

  const orderId = uuidv4();
  const now = new Date().toISOString();

  const order = {
    id: orderId,
    userId,
    userEmail,
    items: itemsWithCurrentPrices,
    total,
    status: 'completed',
    createdAt: now,
  };

  await documentClient.send(new PutCommand({ TableName: TABLES.ORDERS, Item: order }));
  logger.info('Orden creada', { orderId, userId, total });

  for (const item of itemsWithCurrentPrices) {
    await decrementStock(item.productId, item.quantity);
  }

  await clearCart(userId);
  await sendOrderConfirmation(userEmail, order);

  return order;
};

/**
 * Obtiene el historial de órdenes de un usuario.
 */
const getOrdersByUser = async (userId) => {
  const params = {
    TableName: TABLES.ORDERS,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false, // más recientes primero
  };
  const result = await documentClient.send(new QueryCommand(params));
  return result.Items || [];
};

/**
 * Obtiene una orden por ID.
 */
const getOrderById = async (id) => {
  const result = await documentClient.send(new GetCommand({ TableName: TABLES.ORDERS, Key: { id } }));
  return result.Item || null;
};

/**
 * Cancela una orden si pertenece al usuario y está en estado 'completed'.
 */
const cancelOrder = async (id, userId) => {
  const order = await getOrderById(id);
  if (!order) {
    const error = new Error('Orden no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  if (order.userId !== userId) {
    const error = new Error('No tienes acceso a esta orden.');
    error.statusCode = 403;
    throw error;
  }
  if (order.status === 'cancelled') {
    const error = new Error('La orden ya fue cancelada.');
    error.statusCode = 400;
    throw error;
  }

  const params = {
    TableName: TABLES.ORDERS,
    Key: { id },
    UpdateExpression: 'SET #status = :status, cancelledAt = :now',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': 'cancelled',
      ':now': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  };
  const result = await documentClient.send(new UpdateCommand(params));
  logger.info('Orden cancelada', { orderId: id, userId });
  return result.Attributes;
};

/**
 * Elimina permanentemente una orden cancelada.
 */
const deleteOrder = async (id, userId) => {
  const order = await getOrderById(id);
  if (!order) {
    const error = new Error('Orden no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  if (order.userId !== userId) {
    const error = new Error('No tienes acceso a esta orden.');
    error.statusCode = 403;
    throw error;
  }
  if (order.status !== 'cancelled') {
    const error = new Error('Solo se pueden eliminar órdenes canceladas.');
    error.statusCode = 400;
    throw error;
  }
  await documentClient.send(new DeleteCommand({ TableName: TABLES.ORDERS, Key: { id } }));
  logger.info('Orden eliminada', { orderId: id, userId });
};

module.exports = { checkout, getOrdersByUser, getOrderById, cancelOrder, deleteOrder };
