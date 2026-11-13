import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Route Imports
import memberRouter from "./Routes/memberRouter.js";
import userRouter from "./Routes/userRouter.js";
import bookReferencesRouter from "./Routes/bookReferencesRoutes.js";
import ledgerTransactionsRouter from "./Routes/ledgerTransactionsRoutes.js";
import ledgerAccountRouter from "./Routes/ledgerAccountRoutes.js";
import ticketOrderRouter from "./Routes/ticketOrderRoutes.js";
import fs from "fs";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
fs.mkdirSync(path.join(__dirname, "uploads", "ticket-slips"), { recursive: true });

// 1️⃣ Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// 2️⃣ Auth Middleware
app.use((req, res, next) => {
  const tokenString = req.header("Authorization");
  if (!tokenString) return next();

  const token = tokenString.replace("Bearer ", "").trim();
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      console.warn("JWT verification failed:", err.message);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
});

// 3️⃣ MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    console.log("📦 DB Name:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// 4️⃣ Routes
app.use("/api/member", memberRouter);
app.use("/api/user", userRouter);
app.use("/api/book-reference", bookReferencesRouter);
app.use("/api/ledger-transaction", ledgerTransactionsRouter);
app.use("/api/ledger-account", ledgerAccountRouter);
app.use("/api/ticket-orders", ticketOrderRouter);

// 5️⃣ Health Check
app.get("/", (req, res) => {
  res.json({ message: "🚀 API is running", version: "1.0.0" });
});

// 6️⃣ 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// 7️⃣ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// 8️⃣ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
