import express from "express";

import { 
    createMembershipTransaction,
    getMembershipTransactionsByMemberId
} from "../controllers/membershipTransactionController.js";

const membershipTransactionRouter = express.Router();

membershipTransactionRouter.post("/create", createMembershipTransaction);
membershipTransactionRouter.get("/transactions/:customerId", getMembershipTransactionsByMemberId);

export default membershipTransactionRouter;
