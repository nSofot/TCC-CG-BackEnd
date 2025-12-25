import express from "express";
import {
  CreateMember,
  getMembers,
  getMemberById,
  deleteMember,
  updateMember,
  searchMembers
} from "../controllers/memberController.js";

const memberRouter = express.Router();

// ======================== MEMBER ROUTES ========================

// Create a new member
memberRouter.post("/", CreateMember);

// Search members (must come before /:memberId)
memberRouter.get("/search", searchMembers);

// Get all members
memberRouter.get("/", getMembers);

// Get a single member by memberId
memberRouter.get("/:memberId", getMemberById);

// Update a member by memberId
memberRouter.put("/:memberId", updateMember);

// Soft delete a member by memberId
memberRouter.delete("/:memberId", deleteMember);

export default memberRouter;
