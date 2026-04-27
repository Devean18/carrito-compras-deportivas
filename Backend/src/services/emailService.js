const { getTransporter } = require('../config/email');
const logger = require('../config/logger');

const mxn = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

// Descarga la imagen y la convierte a base64 para incrustarla en el correo.
// El backend tiene acceso a MinIO en localhost; el cliente de correo no.


const sendOrderConfirmation = async (to, order) => {

  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;vertical-align:middle;font-weight:600;color:#111827;">${item.name}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">${item.quantity}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#6b7280;">${mxn(item.price)}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#111827;">${mxn(item.subtotal)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:0;border-radius:8px;overflow:hidden;">

      <!-- Header -->
      <div style="background:#111827;padding:28px 24px;text-align:center;">
        <div style="display:inline-block;padding-bottom:8px;border-bottom:3px solid #2563eb;">
          <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:3px;">CARRITO</span><span style="font-family:Arial,sans-serif;font-size:22px;font-weight:300;color:#2563eb;letter-spacing:3px;"> DEPORTIVO</span>
        </div>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:32px;">
        <h2 style="color:#111827;margin-top:0;font-size:20px;">¡Gracias por tu compra!</h2>
        <p style="color:#6b7280;margin-top:0;">Tu pedido ha sido registrado exitosamente. Aquí tienes el resumen:</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:28px;background:#f9fafb;border-radius:6px;overflow:hidden;">
          <tr>
            <td style="color:#6b7280;padding:8px 12px;">Número de orden</td>
            <td style="text-align:right;font-weight:bold;color:#111827;padding:8px 12px;">#${order.id.substring(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 12px;">Fecha</td>
            <td style="text-align:right;color:#6b7280;padding:8px 12px;">${new Date(order.createdAt).toLocaleString('es-MX')}</td>
          </tr>
        </table>

        <h3 style="color:#111827;border-bottom:2px solid #2563eb;padding-bottom:8px;font-size:15px;margin-bottom:0;">Detalle del pedido</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#111827;color:#fff;">
              <th style="padding:10px 12px;text-align:left;font-weight:600;">Producto</th>
              <th style="padding:10px 12px;text-align:center;font-weight:600;">Cant.</th>
              <th style="padding:10px 12px;text-align:right;font-weight:600;">Precio</th>
              <th style="padding:10px 12px;text-align:right;font-weight:600;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsList}</tbody>
          <tfoot>
            <tr style="background:#f9fafb;">
              <td colspan="3" style="padding:14px 12px;text-align:right;font-weight:700;color:#111827;font-size:15px;">Total:</td>
              <td style="padding:14px 12px;text-align:right;font-weight:800;color:#2563eb;font-size:17px;">${mxn(order.total)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- CTA -->
        <div style="text-align:center;margin-top:32px;">
          <a href="http://localhost:5173/orders" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 36px;border-radius:6px;font-weight:700;font-size:15px;letter-spacing:0.5px;">Ver mi pedido</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px;text-align:center;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">Este es un correo automático. Por favor no respondas a este mensaje.</p>
      </div>

    </div>
  `;

  const mailOptions = {
    from: `"Carrito Deportivo" <${process.env.EMAIL_USER || 'noreply@carritodeportivo.com'}>`,
    to,
    subject: `✅ Confirmación de compra - Orden #${order.id.substring(0, 8).toUpperCase()}`,
    html,
  };

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail(mailOptions);
    logger.info('Correo de confirmación enviado', { to, messageId: info.messageId });
    const previewUrl = require('nodemailer').getTestMessageUrl(info);
    if (previewUrl) {
      logger.info('Vista previa de correo disponible', { previewUrl });
    }
    return info;
  } catch (err) {
    logger.error('Error al enviar correo de confirmación', { to, error: err.message });
  }
};

module.exports = { sendOrderConfirmation };
