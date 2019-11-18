'use strict'
const express = require('express');

const transactionsRoutes = require('./routes');

export function getRouter () {
  const router = express.Router({ mergeParams: true });

  router.route('/api/transactions').get(transactionsRoutes.getTransactions);

  return router;
}
