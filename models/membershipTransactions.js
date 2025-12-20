import mongoose from "mongoose";

const membershipTransactionsSchema = new mongoose.Schema({
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
    enum: ["voucher", "receipt", "membershipFee", "funeralFee"],
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

// optional indexes
// membershipTransactionsSchema.index({ customerId: 1 });
// membershipTransactionsSchema.index({ transactionType: 1 });

const MembershipTransaction = mongoose.model(
  "MembershipTransaction",
  membershipTransactionsSchema
);

export default MembershipTransaction;
