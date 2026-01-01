import mongoose from "mongoose";

const bookReferencesSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    required: true,
    enum: ["voucher", "receipt"],
    index: true
  },
  trxBookNo: {
    type: String,
    required: true,
    index: true
  },
  trxReference: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 🚨 Ensures voucher+bookNo or receipt+bookNo cannot repeat
bookReferencesSchema.index({ transactionType: 1, trxBookNo: 1 }, { unique: true });

const BookReferences = mongoose.model("BookReferences", bookReferencesSchema);
export default BookReferences;
