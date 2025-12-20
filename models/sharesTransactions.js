import mongoose from "mongoose";

const sharesTransactionsSchema = new mongoose.Schema({
  trxNumber: {
    type: String,
    required: true,
    unique: true,
  },
  trxBookNo: {
    type: String,
  },
  customerId: {
    type: String,
    required: true,
  },
  transactionType: {
    type: String,
    enum: ["voucher", "receipt", "profit"],
    required: true,
  },
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  trxAmount: {
    type: Number,
    required: true,
    min: [0, "Amount must be positive"],
  },
  isCredit: {
    type: Boolean,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SharesTransaction = mongoose.model(
  "SharesTransaction",
  sharesTransactionsSchema
);

export default SharesTransaction;
