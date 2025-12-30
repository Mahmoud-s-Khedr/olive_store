const { Resend } = require('resend');

function createResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

module.exports = createResendClient;
