import express from "express";

import { 
    createSharesTransaction,
    getSharesTransactionsByMemberId
} from "../controllers/sharesTransactionController.js";

const sharesTransactionRouter = express.Router();

sharesTransactionRouter.post("/create", createSharesTransaction);
sharesTransactionRouter.get("/transactions/:customerId", getSharesTransactionsByMemberId);

export default sharesTransactionRouter;
