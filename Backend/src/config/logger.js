const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  delete meta.service;
  const hasMeta = Object.keys(meta).length > 0;
  const metaStr = hasMeta
    ? '\n' + JSON.stringify(meta, null, 2)
    : '';
  return `${timestamp} ${level.toUpperCase().padEnd(5)} ${stack || message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
  ],
});

module.exports = logger;
