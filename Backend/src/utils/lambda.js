const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { ok, created, fail } = require('./response');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey2024';

/**
 * Parsea el body del evento Lambda (JSON string → objeto).
 */
const parseBody = (event) => {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
};

/**
 * Obtiene un path parameter del evento.
 */
const getPathParam = (event, param) =>
  (event.pathParameters || {})[param] || null;

/**
 * Obtiene un query string parameter del evento.
 */
const getQueryParam = (event, param) =>
  (event.queryStringParameters || {})[param] || null;

/**
 * Verifica el JWT del header Authorization.
 * Retorna el payload decodificado o lanza un error con statusCode.
 */
const requireAuth = (event) => {
  const headers = event.headers || {};
  const authHeader = headers['Authorization'] || headers['authorization'] || '';

  if (!authHeader.startsWith('Bearer ')) {
    const err = new Error('Token de autorización requerido.');
    err.statusCode = 401;
    throw err;
  }

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    const err = new Error(
      e.name === 'TokenExpiredError' ? 'El token ha expirado.' : 'Token inválido.'
    );
    err.statusCode = 401;
    throw err;
  }
};

/**
 * Wrapper para manejar errores en handlers Lambda.
 * Registra el error de forma estructurada y retorna la respuesta correspondiente.
 */
const handleError = (err, event) => {
  logger.error('Error en handler', {
    message:    err.message,
    statusCode: err.statusCode || 500,
    stack:      err.stack,
    path:       event?.path,
    method:     event?.httpMethod,
  });
  return fail(err.message || 'Error interno del servidor', err.statusCode || 500);
};

module.exports = {
  ok,
  created,
  fail,
  parseBody,
  getPathParam,
  getQueryParam,
  requireAuth,
  handleError,
};
