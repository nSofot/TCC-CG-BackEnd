import mongoose from "mongoose";

const ledgerTransactionsSchema = new mongoose.Schema({
    trxId: {
        type: String,
        required: true
    },
    memberId: {
        type: String,
    },
    memberName: {
        type: String,
    },
    trxBookNo: {
        type: String,
        unique: false
    },
    trxDate: {
        type: Date,
        required: true
    },
    transactionType: {
        type: String,
        required: true,
        enum: ['voucher', 'receipt', 'transfer'],
    },
    transactionCategory: {
        type: String,
    },
    accountId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isCredit: {
        type: Boolean,
        required: true
    },
    trxAmount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const LedgerTransactions = mongoose.model("LedgerTransactions", ledgerTransactionsSchema);

export default LedgerTransactions;
