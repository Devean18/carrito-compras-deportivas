const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('EMAIL_USER o EMAIL_PASS no configurados. Creando cuenta Ethereal de prueba...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`Ethereal listo. Ver correos en: https://ethereal.email/login — user: ${testAccount.user}`);
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

module.exports = { getTransporter };
