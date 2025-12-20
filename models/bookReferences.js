import mongoose from "mongoose";

const bookReferencesSchema = new mongoose.Schema({
    transactionType: {
        type: String,
        required: true,
        enum: ['voucher', 'receipt']
    },
    trxBookNo: {
        type: String,
        required: true
    },
    trxReference: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const BookReferences = mongoose.model("BookReferences", bookReferencesSchema);
export default BookReferences