const { v4: uuidv4 } = require('uuid');
const { PutCommand, QueryCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { documentClient, TABLES } = require('../config/dynamodb');
const logger = require('../config/logger');

/**
 * Crea un nuevo producto.
 */
const createProduct = async ({ name, category, price, stock, imageUrl }) => {
  const id = uuidv4();
  const now = new Date().toISOString();

  const product = {
    id,
    name: name.trim(),
    category: category.trim().toLowerCase(),
    price: Number(price),
    stock: Number(stock),
    imageUrl: imageUrl || '',
    createdAt: now,
    updatedAt: now,
  };

  await documentClient.send(new PutCommand({ TableName: TABLES.PRODUCTS, Item: product }));
  logger.info('Producto creado', { productId: id, name: product.name, category: product.category, price: product.price });
  return product;
};

const paginatedCount = async (Command, params) => {
  let total = 0;
  let lastKey;
  do {
    const r = await documentClient.send(new Command({ ...params, ...(lastKey && { ExclusiveStartKey: lastKey }) }));
    total += r.Count;
    lastKey = r.LastEvaluatedKey;
  } while (lastKey);
  return total;
};

const encodeKey = (key) => key ? Buffer.from(JSON.stringify(key)).toString('base64') : null;
const decodeKey = (str) => {
  try { return str ? JSON.parse(Buffer.from(str, 'base64').toString('utf-8')) : undefined; }
  catch { return undefined; }
};

const getProducts = async ({ category, limit = 10, lastKey, minPrice, maxPrice } = {}) => {
  const pageLimit = Math.min(parseInt(limit) || 10, 100);
  const exclusiveStartKey = decodeKey(lastKey);
  const priceFilter = buildPriceFilter(minPrice, maxPrice);
  const filterExp = priceFilter.expression ? { FilterExpression: priceFilter.expression } : {};

  if (category) {
    const categoryBase = {
      TableName: TABLES.PRODUCTS,
      IndexName: 'category-index',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: { ':category': category.toLowerCase(), ...priceFilter.values },
      ...filterExp,
    };
    const totalCount = await paginatedCount(QueryCommand, { ...categoryBase, Select: 'COUNT' });
    const result = await documentClient.send(new QueryCommand({
      ...categoryBase,
      Limit: pageLimit,
      ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey }),
    }));
    return { items: result.Items, nextKey: encodeKey(result.LastEvaluatedKey), count: result.Count, totalCount };
  }

  const scanBase = {
    TableName: TABLES.PRODUCTS,
    ...filterExp,
    ...(priceFilter.expression && { ExpressionAttributeValues: priceFilter.values }),
  };
  const totalCount = await paginatedCount(ScanCommand, { ...scanBase, Select: 'COUNT' });
  const result = await documentClient.send(new ScanCommand({
    ...scanBase,
    Limit: pageLimit,
    ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey }),
  }));
  return { items: result.Items, nextKey: encodeKey(result.LastEvaluatedKey), count: result.Count, totalCount };
};

/**
 * Construye FilterExpression para filtro de precio.
 */
const buildPriceFilter = (minPrice, maxPrice) => {
  const min = minPrice ? Number(minPrice) : null;
  const max = maxPrice ? Number(maxPrice) : null;
  if (min !== null && max !== null) {
    return {
      expression: 'price BETWEEN :minPrice AND :maxPrice',
      values: { ':minPrice': min, ':maxPrice': max },
    };
  }
  if (min !== null) {
    return { expression: 'price >= :minPrice', values: { ':minPrice': min } };
  }
  if (max !== null) {
    return { expression: 'price <= :maxPrice', values: { ':maxPrice': max } };
  }
  return { expression: null, values: {} };
};

/**
 * Obtiene un producto por ID.
 */
const getProductById = async (id) => {
  const result = await documentClient.send(new GetCommand({ TableName: TABLES.PRODUCTS, Key: { id } }));
  return result.Item || null;
};

/**
 * Actualiza un producto existente.
 */
const updateProduct = async (id, updates) => {
  const product = await getProductById(id);
  if (!product) {
    const error = new Error('Producto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const allowed = ['name', 'category', 'price', 'stock', 'imageUrl'];
  const expressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = { ':updatedAt': new Date().toISOString() };

  expressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      expressionParts.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      let value = updates[key];
      if (key === 'category') value = String(value).toLowerCase().trim();
      if (key === 'price' || key === 'stock') value = Number(value);
      expressionAttributeValues[`:${key}`] = value;
    }
  }

  const params = {
    TableName: TABLES.PRODUCTS,
    Key: { id },
    UpdateExpression: `SET ${expressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };

  const result = await documentClient.send(new UpdateCommand(params));
  logger.info('Producto actualizado', { productId: id });
  return result.Attributes;
};

/**
 * Elimina un producto por ID.
 */
const deleteProduct = async (id) => {
  const product = await getProductById(id);
  if (!product) {
    const error = new Error('Producto no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  await documentClient.send(new DeleteCommand({ TableName: TABLES.PRODUCTS, Key: { id } }));
  logger.info('Producto eliminado', { productId: id });
  return true;
};

/**
 * Decrementa el stock de un producto de forma atómica.
 * Lanza error si no hay stock suficiente.
 */
const decrementStock = async (id, quantity) => {
  const params = {
    TableName: TABLES.PRODUCTS,
    Key: { id },
    UpdateExpression: 'SET stock = stock - :qty, updatedAt = :now',
    ConditionExpression: 'stock >= :qty',
    ExpressionAttributeValues: {
      ':qty': quantity,
      ':now': new Date().toISOString(),
    },
  };
  await documentClient.send(new UpdateCommand(params));
  logger.info('Stock decrementado', { productId: id, quantity });
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  decrementStock,
};
