import express from "express";
import { runMongoBackup } from "../utils/mongoBackup.js";


const backupRouter = express.Router();

backupRouter.post("/now", (req, res) => {
  // if (!req.user || req.user.role !== "admin") {
  //   return res.status(403).json({ message: "Unauthorized" });
  // }
  try {
    runMongoBackup();
    res.status(200).json({ message: "Backup started successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Backup failed to start" });
  }
});


export default backupRouter;
