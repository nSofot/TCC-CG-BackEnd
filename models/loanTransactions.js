import mongoose from "mongoose";

const loanTransactionsSchema = new mongoose.Schema({
    trxNumber: {
        type: String,
        required: true,
        unique: true            
    },
    trxBookNo: {
        type: String,
        required: true,
        unique: false
    },
    loanId: {
        type: String,
        required: true,
    },
    customerId: {
        type: String,
        required: true,
    },  
    transactionType: {
        type: String,
        enum: ['voucher', 'receipt'],
        required: true
    },
    transactionDate: {
        type: Date,
        required: true
    },
    interest: {
        type: Number,
        default: 0,
        min: [0, 'Interest must be positive']
    },
    installment: {
        type: Number,
        default: 0,
        min: [0, 'Installment must be positive']
    },
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive']
    },
    isCredit: {
        type: Boolean,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const LoanTransactions = mongoose.model("LoanTransactions", loanTransactionsSchema);

export default LoanTransactions;