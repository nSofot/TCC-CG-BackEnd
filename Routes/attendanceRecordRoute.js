import express from "express";
import {
  createAttendanceRecord,
  getAllAttendanceRecords,
  getAttendanceRecordsByMemberId,
  getAttendanceRecordsByDate
} from "../controllers/attendanceRecordController.js";

const attendanceRecordRouter = express.Router();

attendanceRecordRouter.post("/", createAttendanceRecord);
attendanceRecordRouter.get("/", getAllAttendanceRecords);
attendanceRecordRouter.get("/member/:memberId", getAttendanceRecordsByMemberId);
attendanceRecordRouter.get("/date/:date", getAttendanceRecordsByDate);

export default attendanceRecordRouter;