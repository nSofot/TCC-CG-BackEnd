import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { runMongoBackup } from "./mongoBackup.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Manual backup route (with async & error handling)
app.post("/api/backup-now", async (req, res) => {
  try {
    await runMongoBackup();
    console.log(`[${new Date().toISOString()}] ✅ Backup completed successfully`);
    res.json({ message: "Backup completed successfully" });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Backup failed:`, err.message);
    res.status(500).json({ message: "Backup failed", error: err.message });
  }
});

// ✅ Health check
app.get("/", (req, res) => res.json({ message: "Backup server running" }));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backup server running on port ${PORT}`));
