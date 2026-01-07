import bcrypt from "bcryptjs";
import Member from "../models/member.js";
import { isAdmin } from "./userController.js";

// ======================== CREATE MEMBER =======================

export async function CreateMember(req, res) {
  let memberId = "";

  try {
    // Generate memberId based on type
    if (req.body.memberType === "guest") {
      const lastMember = await Member.find({ memberType: "guest" })
        .sort({ memberId: -1 })
        .limit(1);

      if (lastMember.length > 0) {
        const lastId = parseInt(lastMember[0].memberId.replace(/\D/g, ""), 10);
        memberId = "T" + String(lastId + 1).padStart(3, "0");
      } else {
        memberId = "T001";
      }
    } else {
      const lastMember = await Member.find({ memberType: { $ne: "guest" } })
        .sort({ memberId: -1 })
        .limit(1);

      if (lastMember.length > 0) {
        const lastId = parseInt(lastMember[0].memberId, 10);
        memberId = String(lastId + 1).padStart(4, "0");
      } else {
        memberId = "0001";
      }
    }
  } catch (err) {
    return res.status(500).json({
      message: "Failed to generate memberId",
      error: err.message,
    });
  }

  // ✅ Validate required fields
  const { firstName, lastName, mobile, password } = req.body;
  if (!firstName || !lastName || !mobile) {
    return res.status(400).json({ message: "First name, last name, and mobile are required" });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  // ✅ Hash the password
  try {
    req.body.password = await bcrypt.hash(password, 12);
  } catch (err) {
    return res.status(500).json({ message: "Failed to hash password", error: err.message });
  }

  req.body.memberId = memberId;
  req.body.createdAt = new Date();

  try {
    const member = new Member(req.body);
    await member.save();

    res.status(201).json({
      message: "Member added successfully",
      memberId,
    });
  } catch (error) {
    console.error("Error saving member:", error);
    // Handle duplicate mobile/email error specifically
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({
      message: "Member not added",
      error: error.message,
    });
  }
}


// ======================== GET ALL MEMBERS ========================
export async function getMembers(req, res) {
  try {
    const members = await Member.find({ isDeleted: false, isActive: true });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: "Error getting members", error: err.message });
  }
}

// ======================== GET MEMBER BY ID ========================
export async function getMemberById(req, res) {
  const memberId = req.params.memberId;

  try {
    const member = await Member.findOne({ memberId });
    if (!member) return res.status(404).json({ message: "Member not found or inactive" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: "Error getting member", error: err.message });
  }
}

// ======================== DELETE MEMBER (Soft Delete) ========================
export async function deleteMember(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "You are not authorized to delete member" });

  try {
    const result = await Member.updateOne({ memberId: req.params.memberId }, { isDeleted: true });

    if (result.matchedCount === 0) return res.status(404).json({ message: "Member not found" });

    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete member", error: err.message });
  }
}

// ======================== UPDATE MEMBER ========================
export async function updateMember(req, res) {
  const memberId = req.params.memberId;
  const updatingData = { ...req.body, updatedAt: new Date() };

  try {
    const result = await Member.updateOne({ memberId, isDeleted: false }, updatingData);

    if (result.matchedCount === 0) return res.status(404).json({ message: "Member not found or deleted" });

    res.json({ message: "Member updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update member", error: err.message });
  }
}

// ======================== SEARCH MEMBERS ========================
export async function searchMembers(req, res) {
  const searchQuery = req.query.query || "";

  try {
    const regex = { $regex: searchQuery, $options: "i" };

    const filter = {
      isDeleted: false,
      isActive: true,
      ...(searchQuery.trim() !== "" && {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { address: regex },
          { mobile: regex },
          { email: regex },
        ],
      }),
    };

    const members = await Member.find(filter);
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: "Error searching members", error: err.message });
  }
}
