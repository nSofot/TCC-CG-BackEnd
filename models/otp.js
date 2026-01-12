import mongoose from "mongoose"

const OTPSchema = mongoose.Schema({
    email : {
        require : true,
        type : String
    },
    mobile : {
        require : true,
        type : String
    },
    otp : {
        require : true,
        type : Number
    },
    expiresAt : {
        require : true,
        type : Date
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

const OTP = mongoose.model("OTP",OTPSchema)
export default OTP;