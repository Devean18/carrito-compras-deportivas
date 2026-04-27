const authService = require('../services/authService');
const { parseBody, ok, created, fail, handleError } = require('../utils/lambda');

/**
 * POST /auth/register
 */
module.exports.register = async (event) => {
  try {
    const { name, email, password } = parseBody(event);

    if (!name || !email || !password) {
      return fail('Campos requeridos: name, email, password', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail('El formato del correo electrónico es inválido.', 400);
    }

    if (password.length < 6) {
      return fail('La contraseña debe tener al menos 6 caracteres.', 400);
    }

    if (name.trim().length < 2) {
      return fail('El nombre debe tener al menos 2 caracteres.', 400);
    }

    const result = await authService.register({ name, email, password });
    return created(result, 'Usuario registrado exitosamente.');
  } catch (err) {
    return handleError(err, event);
  }
};

/**
 * POST /auth/login
 */
module.exports.login = async (event) => {
  try {
    const { email, password } = parseBody(event);

    if (!email || !password) {
      return fail('Campos requeridos: email, password', 400);
    }

    const result = await authService.login({ email, password });
    return ok(result, 'Login exitoso.');
  } catch (err) {
    return handleError(err, event);
  }
};
