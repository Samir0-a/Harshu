'use strict';
/**
 * Local entrypoint — `npm start` runs this. It just adds app.listen() on
 * top of the shared app in lib/app.js. Vercel uses api/index.js instead,
 * which exports the same app without a listener (Vercel provides that).
 */
const app = require('./lib/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`  Portfolio running:  http://localhost:${PORT}`);
  console.log(`  Admin panel:        http://localhost:${PORT}/admin/`);
});
