import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    memberType: {
      type: String,
      default: "guest",
      enum: ["guest", "ordinary", "life", "associate", "honorary", "overseas"],
    },

    title: {
      type: String,
      enum: ["Mr.", "Mrs.", "Miss.", "Dr.", "Prof."],
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    address: [{ type: String, trim: true }],

    mobile: {
      type: String,
      sparse: true,
      trim: true,
    },

    phone: String,

    email: {
      type: String,
      lowercase: true,
      sparse: true,
      trim: true,
    },

    image: [{ type: String }],

    joinDate: {
      type: Date,
      default: Date.now,
    },

    notes: String,

    memberRole: {
      type: String,
      enum: [
        "guest",
        "member",
        "president",
        "secretary",
        "treasurer",
        "vice-president",
        "assistant-secretary",
        "assistant-treasurer",
        "activity-coordinator",
        "committee-member",
        "internal-auditor",
      ],
      default: "guest",
    },

    invitedBy: {
      type: String,
      trim: true,
    },

    periodInSchoolFrom: {
      type: Number,
    },

    periodInSchoolTo: {
      type: Number,
    },

    password: {
      type: String,
      select: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
// memberSchema.index({ memberId: 1 });
// memberSchema.index({ email: 1 });

const Member = mongoose.model("Member", memberSchema);
export default Member;
