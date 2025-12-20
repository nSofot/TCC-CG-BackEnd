import AttendanceRecord from "../models/attendanceRecord.js";

export const createAttendanceRecord = async (req, res) => {
  try {
    const attendanceData = req.body; // Expecting an array of objects [{ date, memberId, isPresent }, ...]

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ error: "No attendance records provided" });
    }

    const savedRecords = await AttendanceRecord.insertMany(attendanceData);
    res.status(201).json({
      message: "Attendance records saved successfully",
      count: savedRecords.length,
      records: savedRecords,
    });
  } catch (error) {
    console.error("Error saving attendance records:", error);
    res.status(500).json({ error: "Failed to save attendance records" });
  }
};


export const getAttendanceRecordsByMemberId = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const records = await AttendanceRecord.find({ memberId });
    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
};


export const getAllAttendanceRecords = async (req, res) => {
  try {
    const records = await AttendanceRecord.find();
    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
}

export const getAttendanceRecordsByDate = async (req, res) => {
  try {
    const { year, month } = req.params; // e.g., /api/attendance/2025/10

    // Convert to numbers
    const y = parseInt(year);
    const m = parseInt(month);

    // Create start and end dates for the month
    const startDate = new Date(y, m - 1, 1);              // first day of month
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);   // last day of month

    const records = await AttendanceRecord.find({
      date: { $gte: startDate, $lte: endDate }
    });

    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
};
