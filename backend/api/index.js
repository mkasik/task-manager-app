// Vercel serverless entry point — Express apps work directly as a request
// handler, so this just re-exports the app built in ../app.js. All routing
// (/api/auth, /api/projects, ...) still happens inside Express as normal;
// vercel.json rewrites every /api/* request to this one function.
module.exports = require('../app');
