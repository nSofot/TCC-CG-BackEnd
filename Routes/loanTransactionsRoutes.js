import express from "express";
import { 
        addLoanTransaction,
        getLatestCustomerTransaction,
        getCustomerTransactionByCustomerId,
        getTransactionByLoanId,
        getLastTransactionByCustomerId,
        updateOverdueTransactions,
        getTransactionsByTrxBookNo
    } from "../controllers/loanTransactionsController.js";

const loanTransactionsRouter = express.Router();

// loanTransactionsRouter.get("/pending/:customerId", getCustomerPendingTransactionByCustomerId);
loanTransactionsRouter.get("/customer/:customerId", getCustomerTransactionByCustomerId);
loanTransactionsRouter.get("/last-trx/:customerId/:loanId/:transactionType",getLastTransactionByCustomerId);
loanTransactionsRouter.get("/latest/:transactionType", getLatestCustomerTransaction);
loanTransactionsRouter.get("/transactions/:loanId", getTransactionByLoanId);
loanTransactionsRouter.post("/", addLoanTransaction);
loanTransactionsRouter.put("/overdue/:referenceNumber/pay", updateOverdueTransactions);
loanTransactionsRouter.get("/trxbook/:trxBookNo/:transactionType", getTransactionsByTrxBookNo);

export default loanTransactionsRouter;