import express from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import {
  createTicketOrder,
  getTicketOrders,
  getPaymentSlip,
  updateTicketOrderStatus,
} from "../controllers/ticketOrderController.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slipDirectory = path.resolve(__dirname, "../uploads/ticket-slips");
const storage = multer.diskStorage({
  destination: slipDirectory,
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    callback(allowed.includes(file.mimetype) ? null : new Error("Upload a JPG, PNG, WebP image, or PDF."), allowed.includes(file.mimetype));
  },
});

router.get("/", getTicketOrders);
router.get("/:orderId/payment-slip", getPaymentSlip);
router.patch("/:orderId/status", updateTicketOrderStatus);
router.post("/", (req, res, next) => upload.single("paymentSlip")(req, res, (error) => {
  if (error) return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Payment slip must be 5 MB or smaller." : error.message });
  next();
}), createTicketOrder);

export default router;
