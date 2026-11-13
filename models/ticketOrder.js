import mongoose from "mongoose";

const ticketOrderSchema = new mongoose.Schema({
  referenceNumber: { type: String, unique: true, sparse: true, trim: true },
  eventName: { type: String, required: true, trim: true, maxlength: 120 },
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  mobileNumber: { type: String, required: true, trim: true, maxlength: 30 },
  emailAddress: { type: String, trim: true, lowercase: true, maxlength: 254 },
  nicNumber: { type: String, required: true, trim: true, maxlength: 30 },
  address: { type: String, required: true, trim: true, maxlength: 500 },
  paidAmount: { type: Number, required: true, min: 0 },
  paymentSlip: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

export default mongoose.model("TicketOrder", ticketOrderSchema);
