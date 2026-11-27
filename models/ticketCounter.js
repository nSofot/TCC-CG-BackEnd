import mongoose from "mongoose";

const ticketCounterSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },
  sequence: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("TicketCounter", ticketCounterSchema);
