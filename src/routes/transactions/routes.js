'use strict'
const transactionService = require('../../services/transaction');

export async function getTransactions(req, res) {
  const { transactionId, confidenceLevel } = req.query;

  if (!transactionId) {
    res.status(400);
    return res.send('You must specify the transactionId parameter');
  }

  if (!confidenceLevel) {
    res.status(400);
    return res.send('You must specify the confidenceLevel parameter');
  }

  if (confidenceLevel < 0 || confidenceLevel > 1) {
    res.status(400);
    return res.send('The confidence level provided is out of bounds');
  }

  try {
    const transactions = await transactionService.getTransactions(transactionId, confidenceLevel);
  
    if (!transactions || transactions.length === 0) {
      return res.sendStatus(404);
    }
    return res.json(transactions);
  } catch (err) {
    res.status(500);
    return res.send(err.message);
  }
}
