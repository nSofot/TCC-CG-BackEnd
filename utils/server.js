// server.js (or index.js)
import express from "express";
import cors from "cors";
import { runMongoBackup } from "./mongoBackup.js";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Manual backup route
app.post("/api/backup-now", (req, res) => {
  runMongoBackup();
  res.json({ message: "Backup started successfully" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
