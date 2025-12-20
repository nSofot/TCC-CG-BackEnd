import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import Customer from "../models/customer.js";
import SharesTransactions from "../models/sharesTransactions.js";


const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temporary upload folder

// POST /api/import-customers
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // 1️⃣ Read uploaded Excel file
    const workbook = xlsx.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(worksheet);
    const dateAsAt = req.body.dateAsAt;

    if (!rows.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Excel file is empty" });
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let transactions = [];

    // 2️⃣ Process each row
    for (const row of rows) {
      const customerId = String(row["Member No"] || "").trim();
      const numericAmount = Number(row["Profit"]) || 0;
      // const transactionDate = row["Date"] ? new Date(row["Date"]) : new Date();
      const transactionDate = dateAsAt ? new Date(dateAsAt) : new Date();
      const remark = row["Remark"] || "";

      if (!customerId) {
        skippedCount++;
        continue; // skip invalid rows
      }

      // Check if customer exists
      const customer = await Customer.findOne({ customerId });
      if (!customer) {
        skippedCount++;
        continue; // skip if no matching customer
      }

      // Update customer shares
      await Customer.updateOne(
        { customerId },
        {
          $inc: { shares: Math.abs(numericAmount) },
          $set: { updatedAt: new Date() },
        }
      );

      updatedCount++;

      // Queue membership transaction (batch insert later)
      transactions.push({
        trxNumber: `PRFT-${Date.now()}-${customerId}`,
        trxBookNo: "",
        customerId,
        transactionType: "profit",
        transactionDate,
        trxAmount: Math.abs(numericAmount),
        isCredit: false,
        description: remark,
      });
    }

    // 3️⃣ Insert transactions in bulk for performance
    if (transactions.length) {
      await SharesTransactions.insertMany(transactions);
    }

    // 4️⃣ Cleanup temp file
    fs.unlinkSync(req.file.path);

    // 5️⃣ Send response
    res.json({
      success: true,
      updatedCustomers: updatedCount,
      skippedRows: skippedCount,
      totalRows: rows.length,
    });
  } catch (err) {
    console.error("Import error:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

export default router;
