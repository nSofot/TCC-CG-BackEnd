import { isTreasurer } from "./userController.js";
import SharesTransaction from "../models/sharesTransactions.js";

export async function createSharesTransaction(req, res) {
  try {

    const { transactionType, trxAmount, isCredit } = req.body;

    // Validate required fields
    if (trxAmount == null || trxAmount < 0) {
      return res.status(400).json({ message: "Transaction amount must be positive" });
    }

    if (typeof isCredit !== "boolean") {
      return res.status(400).json({ message: "isCredit must be true or false" });
    }

    // Prefix map
    const prefixMap = {
      voucher: "VOCH-",
      receipt: "RCPT-",
      profit: "PRFT-"
    };

    const prefix = prefixMap[transactionType];
    if (!prefix) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    // Generate next trxNumber
    let referenceNumber = `${prefix}000001`;
    const lastTransaction = await SharesTransaction.findOne({ transactionType }).sort({ createdAt: -1 });

    if (lastTransaction) {
      const match = lastTransaction.trxNumber?.match(new RegExp(`^${prefix}(\\d{6})$`));
      if (match) {
        const lastId = parseInt(match[1], 10);
        referenceNumber = `${prefix}${String(lastId + 1).padStart(6, "0")}`;
      }
    }

    req.body.trxNumber = referenceNumber;
    if (!req.body.transactionDate) req.body.transactionDate = new Date();

    const newTransaction = new SharesTransaction(req.body);
    await newTransaction.save();

    res.status(201).json({
      message: "Membership transaction created successfully",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error("Error creating member transaction:", err);
    res.status(500).json({
      message: "Failed to create member transaction",
      error: err.message,
    });
  }
}


export async function getSharesTransactionsByMemberId(req, res) {
  try {
    const { customerId } = req.params;
    const transactions = await SharesTransaction.find({ customerId });
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching member transactions:", err);
    res.status(500).json({
      message: "Failed to fetch member transactions",
      error: err.message,
    });
  }
}
