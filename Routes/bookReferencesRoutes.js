import express from "express";
import { 
  createBookReference,
  getBookReferenceByBookNoAndTransactionType
} from "../controllers/bookReferencesController.js";


const router = express.Router();

// ✅ Create a new book reference
router.post("/", createBookReference);

// ✅ Check if a book reference exists by book number & transaction type
router.get("/trxbook/:trxBookNo/:transactionType", getBookReferenceByBookNoAndTransactionType);

export default router;
