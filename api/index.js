'use strict';
/**
 * Vercel entrypoint. Every request to /api/* is rewritten to this single
 * function (see vercel.json), which hands it to the same Express app used
 * for local development — Express apps are callable as (req, res), so
 * exporting it directly is all Vercel needs.
 */
module.exports = require('../lib/app');
