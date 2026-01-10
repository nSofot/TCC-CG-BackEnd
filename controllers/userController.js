import Member from "../models/member.js";
import OTP from "../models/otp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Role utilities
export function isAdmin(req) {
  return req.member && req.member.memberRole === "admin";
}

export function isPresident(req) {
  return req.member && req.member.memberRole === "president";
}

export function isSecretary(req) {
  return req.member && req.member.memberRole === "secretary";
}

export function isTreasurer(req) {
  return req.member && req.member.memberRole === "treasurer";
}

export function isExecutive(req) {
  return req.member && req.member.memberRole === "executive";
}

export function getUserRole(req) {
  const allowedRoles = ["member","president","secretary","treasurer","executive","admin"];
  if (req.member && allowedRoles.includes(req.member.memberRole)) {
    return req.member.memberRole;
  }
  return null;
}

// ======================== LOGIN USER ========================
export async function loginUsers(req, res) {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({
      message: "Member ID, Mobile or Email and password are required",
    });
  }

  try {
    const member = await Member.findOne({
      $or: [{ memberId: loginId }, { mobile: loginId }, { email: loginId }],
    }).select("+password");

    if (!member) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔒 VERY IMPORTANT CHECK
    if (!member.password) {
      return res.status(401).json({
        message: "This account uses Google login. Please login with Google.",
      });
    }

    const valid = await bcrypt.compare(password, member.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        memberId: member.memberId,
        memberRole: member.memberRole,
      },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      memberId: member.memberId,
      memberRole: member.memberRole,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
}


// ======================== GOOGLE LOGIN ========================
export async function loginWithGoogle(req, res) {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ message: "Access token is required" });
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const email = response.data.email?.toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ message: "Invalid Google user info" });
    }

    const member = await Member.findOne({
      email,
      isDeleted: { $ne: true }
    });

    if (!member) {
      return res.status(404).json({ message: "User not found in the database" });
    }

    const token = jwt.sign(
      {
        memberId: member.memberId,
        mobile: member.mobile,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        memberRole: member.memberRole,
      },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      memberId: member.memberId,
      mobile: member.mobile,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      memberRole: member.memberRole,
    });

  } catch (err) {
    console.error("Google login failed:", err);
    res.status(500).json({ message: "Google login failed" });
  }
}

// ======================== EMAIL TRANSPORTER ========================
const transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.VITE_EMAILL,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================== SEND OTP ========================
export async function sendOTP(req, res) {
  try {
    const { email, memberId, mobile } = req.body;

    if (!email || !memberId || !mobile) {
      return res.status(400).json({ message: "Email, Member ID and Mobile are required" });
    }

    const member = await Member.findOne({ email, memberId, mobile });
    if (!member) {
      return res.status(404).json({
        message: "Member not found or details do not match"
      });
    }

    await OTP.deleteMany({ email, memberId });

    const randomOTP = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await OTP.create({
      email,
      memberId,
      otp: randomOTP,
      expiresAt,
    });

    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password - TCC Colombo Group",
      text: `Your OTP is ${randomOTP}. It expires in 10 minutes.`,
    });

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({
      message: "Failed to send OTP",
      error: err.message,
    });
  }
}



// ======================== RESET PASSWORD ========================
export async function resetPassword(req, res) {
  try {
    let { email, memberId, otp, newPassword } = req.body;

    email = email.toLowerCase().trim();

    const otpDoc = await OTP.findOne({ email });
    if (!otpDoc) {
      return res.status(403).json({ message: "OTP not found" });
    }

    if (Date.now() > otpDoc.expiresAt) {
      return res.status(403).json({ message: "OTP expired" });
    }

    if (String(otp) !== String(otpDoc.otp)) {
      return res.status(403).json({ message: "Invalid OTP" });
    }

    const member = await Member.findOne({ email, memberId });
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.password = await bcrypt.hash(newPassword, 12);
    await member.save();

    await OTP.deleteMany({ email, memberId });

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ message: "Reset failed" });
  }
}



// ======================== DELETE USER (Soft Delete) ========================
export async function deleteUser(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "You are not authorized to delete member" });

  try {
    const result = await Member.updateOne({ memberId: req.params.userId }, { isDeleted: true });

    if (result.matchedCount === 0) return res.status(404).json({ message: "Member not found" });

    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete member", error: err.message });
  }
}

// ======================== UPDATE USER ========================
export async function updateUser(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized access" });

  try {
    const { memberId } = req.params;

    const result = await User.updateOne({ memberId: memberId }, req.body);

    if (result.matchedCount === 0) return res.status(404).json({ message: "Member not found" });

    res.json({ message: "Member updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update member", error: err.message });
  }
}

// ======================== GET ALL USERS ========================
export async function getUsers(req, res) {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch members", error: err.message });
  }
}

// ======================== GET AUTHENTICATED USER ========================
export function getUser(req, res) {
  if (!req.user) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const {
    memberId,
    mobile,
    email,
    firstName,
    lastName,
    memberRole,
  } = req.user;

  res.json({
    memberId,
    mobile,
    email,
    firstName,
    lastName,
    memberRole,
  });
}


export async function createGoogleUser(req, res) {
    const { accessToken, mobile, invitedBy } = req.body;

    if (!accessToken || !mobile || !invitedBy) {
        return res.status(400).json({ message: "Access token, mobile, and invitedBy are required" });
    }

    try {
        // Get Google user info
        const response = await axios.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const { email, given_name, family_name, picture } = response.data;

        /* ===============================
           CHECK EXISTING EMAIL OR MOBILE
        ================================ */
        const existingUser = await Member.findOne({
            $or: [
                { email },
                { mobile }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(409).json({ message: "Email already exists" });
            }
            if (existingUser.mobile === mobile) {
                return res.status(409).json({ message: "Mobile number already exists" });
            }
        }

        /* ===============================
           GENERATE MEMBER ID
        ================================ */
        const lastMember = await Member.find({
            memberType: "guest",
            memberId: { $exists: true }
        })
            .sort({ createdAt: -1 })
            .limit(1);

        let memberId;
        if (lastMember.length && lastMember[0].memberId) {
            const lastNumber = parseInt(lastMember[0].memberId.replace(/\D/g, "")) || 0;
            memberId = "T" + String(lastNumber + 1).padStart(3, "0");
        } else {
            memberId = "T001";
        }

        /* ===============================
           CREATE USER
        ================================ */
        const hashpassword = bcrypt.hashSync(
            process.env.JWT_KEY + "googleUser",
            10
        );

        const user = new Member({
            memberId,
            mobile,
            invitedBy,
            email,
            firstName: given_name,
            lastName: family_name || given_name,
            password: hashpassword,
            image: picture,
            memberRole: "guest",
            memberType: "guest",
            isActive: true,
        });

        await user.save();

        /* ===============================
           JWT
        ================================ */
        const tokenJWT = jwt.sign(
            {
                memberId: user.memberId,
                mobile: user.mobile,
                email: user.email,
                memberRole: user.memberRole
            },
            process.env.JWT_KEY,
            { expiresIn: "1d" }
        );

        res.json({
            message: "User added successfully",
            token: tokenJWT
        });

    } catch (err) {
        console.error("Google user creation failed:", err);
        res.status(500).json({
            message: "User not added",
            error: err.message
        });
    }
}

