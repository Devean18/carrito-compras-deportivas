const { PutCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { documentClient, TABLES } = require('../config/dynamodb');
const logger = require('../config/logger');

/**
 * Obtiene los favoritos de un usuario.
 */
const getFavorites = async (userId) => {
  const result = await documentClient.send(new QueryCommand({
    TableName: TABLES.FAVORITES,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  }));
  return result.Items || [];
};

/**
 * Agrega un producto a favoritos.
 */
const addFavorite = async (userId, product) => {
  const item = {
    userId,
    productId: product.id,
    name:      product.name,
    price:     product.price,
    imageUrl:  product.imageUrl || '',
    category:  product.category,
    addedAt:   new Date().toISOString(),
  };
  await documentClient.send(new PutCommand({ TableName: TABLES.FAVORITES, Item: item }));
  logger.info('Producto agregado a favoritos', { userId, productId: product.id, productName: product.name });
  return item;
};

/**
 * Elimina un producto de favoritos.
 */
const removeFavorite = async (userId, productId) => {
  await documentClient.send(new DeleteCommand({
    TableName: TABLES.FAVORITES,
    Key: { userId, productId },
  }));
  logger.info('Producto eliminado de favoritos', { userId, productId });
};

module.exports = { getFavorites, addFavorite, removeFavorite };
