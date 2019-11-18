'use strict'
import { connect, Schema, model } from 'mongoose';

connect(
  // process.env.MONGODBCONNSTR,
  'mongodb+srv://cgalvao:l8ULfAsmkN2K191H@cluster0-wcj5a.mongodb.net/retail24?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    console.log(err ? 'Error connecting to MongoDB: ' + err : 'Successfully connected to MongoDB');
  }
);

const transactionProps = {
  id: {
    type: String
  },
  age: {
    type: Number
  },
  name: {
    type: String
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  geoInfo: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },
  connectionInfo: {
    _type: {
      type: Number
    },
    confidence: {
      type: Number
    }
  }
};
const Transaction = model('transactions', new Schema({ transactionProps, children: [new Schema(transactionProps)]}));

export async function getTransactions(transactionId, confidenceLevel) {
  let transactions = JSON.parse(JSON.stringify(await Transaction.find()));

  transactions = findTransaction(transactionId, transactions);

  /** 
   * I'm aware I'm iterating over this collection multiple
   * times and I could do those last steps probably at once,
   * but in this case, based in the current situation,
   * I chose readability over performance. Besides, it would not
   * compromise the time complexity, once O(n + n + n + n) = O(n)
   * */

  transactions = setCombinedConnectionInfo(transactions);

  delete transactions['connectionInfo'];

  transactions = flattenTransactions(transactions);
  transactions = filterByConfidenceLevel(confidenceLevel, transactions);

  return transactions;
}

const findTransaction = (transactionId, transactions) => {
  for (const transaction of transactions) {
    if (transaction.id === transactionId) {
      return transaction;
    }
    
    if (transaction.children && transaction.children.length > 0) {
      const childTransaction = findTransaction(transactionId, transaction.children);
      if (childTransaction) {
        return childTransaction;
      }
    }
  }
}

const setCombinedConnectionInfo = transactions => {
  let parentTypes = [];

  if (transactions.connectionInfo) {
    parentTypes.push(transactions.connectionInfo.type);
  }

  const setChildCombinedConnectionInfo = parent => {
    for (const child of parent.children) {
      child.combinedConnectionInfo = {
        confidence: child.connectionInfo.confidence * (parent.connectionInfo ? parent.connectionInfo.confidence : 1),
        types: parentTypes.length > 0 ? [...parentTypes, child.connectionInfo.type] : [child.connectionInfo.type]
      };      
  
      if (child.children && child.children.length > 0) {
        if (child.connectionInfo) {
          parentTypes.push(child.connectionInfo.type);
        }

        setChildCombinedConnectionInfo(child);
      }
    }
  }

  setChildCombinedConnectionInfo(transactions);

  return transactions;
}

const flattenTransactions = transaction => {
  const flatTransactions = [];

  const addFlatTransaction = transaction => {
    flatTransactions.push(getTransaction(transaction));
  }

  const flattenChildTransactions = children => {
    for (const child of children) {
      addFlatTransaction(child);
      if (child.children && child.children.length > 0) {
        flattenChildTransactions(child.children);
      }
    }
  }

  addFlatTransaction(transaction);
  flattenChildTransactions(transaction.children);

  return flatTransactions;
}

const filterByConfidenceLevel = (confidenceLevel, transactions) => {
  return transactions.filter(transaction => {
    if (transaction.connectionInfo) {
      return transaction.connectionInfo.confidence >= confidenceLevel;
    }
    return true;
  });
}

const getTransaction = transaction => {
  const { id, age, name, email, phone, geoInfo, connectionInfo, combinedConnectionInfo } = transaction;
  return { id, age, name, email, phone, geoInfo, connectionInfo, combinedConnectionInfo };
}
