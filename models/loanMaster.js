import { application } from "express";
import mongoose from "mongoose";

const loanMasterSchema = new mongoose.Schema({
    loanId: {
        type: String,
        required: true,
        unique: true
    },
    customerId: {
        type: String,
        required: true 
    },
    firstGuarantorId: {
        type: String,
        default: ""
    },
    secondGuarantorId: {
        type: String,
        default: ""
    },
    loanType: {
        type: String,
        required: true,
        enum: ["Daily Loan", "Welfare Loan", "Short Term Loan", "Long Term Loan", "Project Loan"]
    },
    amount: {
        type: Number,
        required: true
    },
    loanDuration: {
        type: Number,
        required: true
    },
    loanInterestRate: {
        type: Number,
        required: true
    },
    dueAmount: {
        type: Number,
        required: true
    },
    isApprovedChairman: {
        type: Boolean,
        default: false
    },
    isApprovedSecretary: {
        type: Boolean,
        default: false
    },
    isApprovedTreasurer: {
        type: Boolean,
        default: false
    },
    isApprovedExecutive: {
        type: Boolean,
        default: false
    },
    isApprovedManager: {
        type: Boolean,
        default: false
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isRejected: {
        type: Boolean,
        default: false
    },
    isGranted: {
        type: Boolean,
        default: false
    },
    voucherNumber: {
        type: String,
        default: ""
    },
    applicationDate: {
        type: Date,
        required: true
    },
    approvalDate: {
        type: Date,
        default: null
    },
    issuedDate: {
        type: Date,
        default: null
    },    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const LoanMaster = mongoose.model("LoanMaster", loanMasterSchema);
export default LoanMaster;