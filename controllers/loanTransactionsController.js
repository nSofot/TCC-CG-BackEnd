import { isAdmin } from "./userController.js";
import LoanTransactions from "../models/loanTransactions.js";

export async function addLoanTransaction(req, res) {
    try {
        const { transactionType } = req.body;

        const prefixMap = {
            voucher: "VOUC-",
            receipt: "RCPT-",
        };

        const prefix = prefixMap[transactionType];
        if (!prefix) {
            return res.status(400).json({ message: "Invalid transaction type" });
        }

        // 🔹 Generate trxNumber
        let trxNumber = prefix + "000001";
        const lastTransaction = await LoanTransactions
            .findOne({ transactionType })
            .sort({ createdAt: -1 });

        if (lastTransaction) {
            const match = lastTransaction.trxNumber?.match(
                new RegExp(`^${prefix}(\\d{6})$`)
            );
            if (match) {
                const lastId = parseInt(match[1], 10);
                trxNumber = prefix + String(lastId + 1).padStart(6, "0");
            }
        }

        req.body.trxNumber = trxNumber;

        // 🔹 Save new loan transaction
        const LoanTransaction = new LoanTransactions(req.body);
        await LoanTransaction.save();

        return res.status(201).json({
            message: "Loan transaction created successfully",
            transaction: LoanTransaction,
        });

    } catch (err) {
        console.error("❌ Error creating loan transaction:", err);
        return res.status(500).json({
            message: "Failed to create loan transaction",
            error: err.message,
        });
    }
}


export async function getLatestCustomerTransaction(req, res) {
    // Ensure user is an admin
    if (!(await isAdmin(req))) {
        return res.status(403).json({ message: "You are not authorized to add a transaction" });
    }

    const { transactionType } = req.params; // ✅ FIXED

    try {
        const latest = await CustomerTransactions.findOne({ transactionType })
            .sort({ createdAt: -1 })
            .lean();

        if (!latest) {
            return res.status(404).json({ message: "No transactions for this type" });
        }

        res.json(latest);
    } catch (err) {
        console.error("Error fetching latest transaction:", err);
        res.status(500).json({ message: "Server error while fetching transaction" });
    }
}


export async function updateOverdueTransactions(req, res) {
    const referenceNumber = req.params.referenceNumber;
    const paidAmount = parseFloat(req.body.paidAmount);

    if (isNaN(paidAmount) || paidAmount <= 0) {
        return res.status(400).json({ message: "Invalid paid amount." });
    }

    try {
        const invoice = await CustomerTransactions.findOne({ referenceNumber });

        if (!invoice) {
            return res.status(404).json({ message: "Credit transction not found." });
        }

        const newDueAmount = parseFloat(invoice.dueAmount) - paidAmount;

        invoice.dueAmount = newDueAmount >= 0 ? newDueAmount : 0;
        await invoice.save();

        return res.status(200).json({
            message: "Due amount updated successfully.",
            updatedDueAmount: invoice.dueAmount
        });
    } catch (err) {
        console.error("Error updating credit invoice due amount:", err);
        return res.status(500).json({
            message: "Internal server error while updating due amount."
        });
    }
}


export async function getCustomerTransactionByCustomerId(req, res) {
    const { customerId } = req.params;

    try {
        const transactions = await CustomerTransactions.find({ customerId });

        if (transactions.length === 0) {
            return res.status(404).json({ message: "No transactions found for this customer" });
        }

        res.json(transactions);
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ message: "Server error while fetching transactions" });
    }
}


export async function getTransactionsByTrxBookNo(req, res) {
    const { trxBookNo, transactionType } = req.params;

    try {
        const transactions = await LoanTransactions.find({ trxBookNo, transactionType });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: "Server error while fetching transactions" });
    }
}


export async function getLastTransactionByCustomerId(req, res) {
    const { customerId, loanId, transactionType } = req.params;
    try {
        const lastTransaction = await LoanTransactions
            .findOne(
                { 
                    customerId,
                    loanId,
                    transactionType
                })
            .sort({ createdAt: -1 });

        res.json(lastTransaction);
    } catch (err) {
        res.status(500).json({ message: "Server error while fetching last transaction" });
    }
}

export async function getTransactionByLoanId(req, res) {
    const { loanId } = req.params;
    try {
        const transactions = await LoanTransactions.find({ loanId });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: "Server error while fetching transactions" });
    }
}