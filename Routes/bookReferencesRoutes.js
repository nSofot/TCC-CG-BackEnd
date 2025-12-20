import express from "express";

import { 
    createBookReference,
    getBookReferenceByBookNoAndTransactionType

 } from "../controllers/bookReferencesController.js";

const bookReferencesRouter = express.Router();

bookReferencesRouter.post("/", createBookReference);
bookReferencesRouter.get("/trxbook/:trxBookNo/:transactionType", getBookReferenceByBookNoAndTransactionType);


export default bookReferencesRouter;