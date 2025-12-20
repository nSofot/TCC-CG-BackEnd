import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import Customer from "../models/customer.js"; // your schema

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temp folder for uploaded files

// API endpoint: POST /api/import-customers
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 1. Read uploaded Excel file
    const workbook = xlsx.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    // 2. Transform rows → match Customer schema fields
    const customers = rows.map((row) => ({
      customerId: row["Member ID"], // required
      customerType: "shareholder",
      title: "Mr.",
      name: row["Name"],
      nameSinhala: row["Name (Sinhala)"] || "",
      familyMembers: [],
      address: [],
      mobile: "",
      phone: "",
      email: "",
      image: [],
      joinDate: row["Join Date"] ? new Date(row["Join Date"]) : null,
      shares: Number(0),
      profits: Number(0),
      membership: Number(0),
      holdAmount: Number(0),
      notes: "",
      memberRole: "member",
      isDeleted: false,
      isActive:  true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));


    // 3. Insert into MongoDB
    await Customer.insertMany(customers, { ordered: false }); // skip duplicates

    res.json({ success: true, inserted: customers.length });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;