'use strict';

const app = require('./backend/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🚀 Finance Portfolio MERN Stack Backend Running!`);
  console.log(`  📍 Local API Server: http://localhost:${PORT}`);
  console.log(`  📍 Admin Login API: http://localhost:${PORT}/api/login`);
  console.log(`======================================================\n`);
});
