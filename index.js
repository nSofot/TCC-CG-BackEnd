import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";



// Route Imports
import userRouter from "./Routes/userRouter.js";
import customerRouter from "./Routes/customerRouter.js";
import membershipTransactionRouter from "./Routes/membershipTransactionRouter.js";
import loanTransactionsRouter from "./Routes/loanTransactionsRoutes.js";
import ledgerAccountRouter from "./Routes/ledgerAccountRoutes.js";
import ledgerTransactionsRouter from "./Routes/ledgerTransactionsRoutes.js";
import loanMasterRouter from "./Routes/loanMasterRoutes.js";
import bookReferencesRouter from "./Routes/bookReferencesRoutes.js";
import sharesTransactionRouter from "./Routes/sharesTransactionRoutes.js";
import attendanceRecordRoute from "./Routes/attendanceRecordRoute.js";
import importSharesProfitsRoute from "./Routes/importSharesProfitsRoute.js";
import importCustomerRoute from "./Routes/importCustomerRoute.js";
import backupRouter from "./Routes/backupRouter.js";


dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1️⃣ Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*", // allow frontend
  credentials: true,
}));
app.use(express.json({ limit: "10mb" })); // prevent payload size issues

// 2️⃣ Auth Middleware
app.use((req, res, next) => {
  const tokenString = req.header("Authorization");
  if (!tokenString) return next(); // allow public routes

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
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // exit process if DB connection fails
  });

// 4️⃣ Routes
app.use("/api/user", userRouter);
app.use("/api/customer", customerRouter);
app.use("/api/membershipTransactions", membershipTransactionRouter);
app.use("/api/loanTransactions", loanTransactionsRouter);
app.use("/api/ledgerAccounts", ledgerAccountRouter);
app.use("/api/ledgerTransactions", ledgerTransactionsRouter);
app.use("/api/loanMaster", loanMasterRouter);
app.use("/api/bookReferences", bookReferencesRouter);
app.use("/api/sharesTransactions", sharesTransactionRouter);
app.use("/api/attendanceRecord", attendanceRecordRoute);
app.use("/api/importSharesProfits", importSharesProfitsRoute);
app.use("/api/import-customers", importCustomerRoute);
app.use("/api/backup-now", backupRouter);



// 5️⃣ Health Check Route (for testing/deployment)
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
