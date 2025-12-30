const createResendClient = require('../config/resend');

async function sendVerificationEmail(user, token) {
  const resend = createResendClient();
  const verifyUrl = `${process.env.FRONTEND_URL || ''}/verify-email.html?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Verify your email',
    html: `<p>Hi ${user.name || ''}, verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

async function sendPasswordResetEmail(user, token) {
  const resend = createResendClient();
  const resetUrl = `${process.env.FRONTEND_URL || ''}/reset-password.html?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Hi ${user.name || ''}, reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

async function sendOrderConfirmationEmail(order, items) {
  const resend = createResendClient();
  if (!order.email) return;
  const list = items
    .map((i) => `<li>${i.product_name_en || ''} x ${i.quantity} - ${i.total}</li>`)
    .join('');
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: order.email,
    subject: `Order ${order.order_number} confirmed`,
    html: `<p>Thanks for your order ${order.customer_name || ''}.</p><ul>${list}</ul><p>Total: ${order.total}</p>`,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};
