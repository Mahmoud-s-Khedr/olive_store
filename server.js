require('dotenv').config();

const app = require('./app/app');
const { checkServices } = require('./app/utils/serviceHealth');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  checkServices()
    .then((result) => {
      const format = (name, status) => `${name}=${status.ok ? 'ok' : 'fail'} (${status.details || 'no details'})`;
      console.log(`[services] ${format('database', result.database)} | ${format('r2', result.r2)} | ${format('resend', result.resend)}`);
    })
    .catch((err) => {
      console.log(`[services] health check failed: ${err.message}`);
    });
});
