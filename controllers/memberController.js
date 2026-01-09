import bcrypt from "bcryptjs";
import Member from "../models/member.js";
import { isAdmin } from "./userController.js";

// ======================== CREATE MEMBER =======================

export async function CreateMember(req, res) {
  let memberId = "";
  try {
    if (req.body.memberType === "guest") {
      const lastMember = await Member.find({ memberType: "guest" })
        .sort({ memberId: -1 })
        .limit(1);
      memberId = lastMember.length
        ? "T" + String(parseInt(lastMember[0].memberId.replace(/\D/g, "")) + 1).padStart(3, "0")
        : "T001";
    } else {
      const lastMember = await Member.find({ memberType: { $ne: "guest" } })
        .sort({ memberId: -1 })
        .limit(1);
      memberId = lastMember.length    
        ? String(parseInt(lastMember[0].memberId) + 1).padStart(4, "0")
        : "0001";
    }
  } catch (err) {
    return res.status(500).json({ message: "Failed to generate memberId", error: err.message });
  }

  const { firstName, lastName, mobile } = req.body;

  if (!firstName || !lastName || !mobile) {
    return res.status(400).json({
      message: "First name, last name, and mobile are required",
    });
  }

  // remove empty strings
  Object.keys(req.body).forEach(key => {
    if (req.body[key] === "") delete req.body[key];
  });

  // auto password
  const rawPassword = req.body.password || mobile;

  try {
    req.body.password = await bcrypt.hash(rawPassword, 12);
  } catch (err) {
    return res.status(500).json({ message: "Failed to hash password", error: err.message });
  }

  req.body.memberId = memberId;
  try {
    const member = new Member(req.body);
    await member.save();

    res.status(201).json({
      message: "Member added successfully",
      memberId,
    });
  } catch (error) {
    console.error("Error saving member:", error);

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
  // if (!isAdmin(req)) return res.status(403).json({ message: "You are not authorized to delete member" });

  try {
    // const result = await Member.updateOne({ memberId: req.params.memberId }, { isDeleted: true });
    const result = await Member.deleteOne({ memberId: req.params.memberId });
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
