const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { documentClient, TABLES } = require('../config/dynamodb');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Busca un usuario por email usando el GSI email-index.
 */
const findUserByEmail = async (email) => {
  const params = {
    TableName: TABLES.USERS,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email.toLowerCase().trim() },
  };
  const result = await documentClient.send(new QueryCommand(params));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
};

/**
 * Registra un nuevo usuario.
 */
const register = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    const error = new Error('El correo electrónico ya está registrado.');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const now = new Date().toISOString();

  const user = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  };

  await documentClient.send(new PutCommand({ TableName: TABLES.USERS, Item: user }));
  logger.info('Usuario registrado exitosamente', { email: normalizedEmail });

  const { password: _pwd, ...userWithoutPassword } = user;
  const token = jwt.sign({ id, email: normalizedEmail, name: user.name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return { user: userWithoutPassword, token };
};

/**
 * Autentica un usuario y retorna un JWT.
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    logger.warn('Intento de login fallido: correo no registrado', { email: normalizedEmail });
    const error = new Error('El correo electrónico no está registrado.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn('Intento de login fallido: contraseña incorrecta', { email: normalizedEmail });
    const error = new Error('La contraseña es incorrecta.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  logger.info('Usuario autenticado', { email: normalizedEmail });
  const { password: _pwd, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

module.exports = { register, login, findUserByEmail };
