import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    memberId: {
        type: String,
        required: true
    },
    isPresent: {
        type: Boolean,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema);
export default AttendanceRecord