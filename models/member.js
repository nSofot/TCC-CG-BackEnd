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
      default: "ordinary",
      enum: [
        "ordinary",
        "life",
        "associate",
        "honorary",
        "overseas",
      ],
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

    address: [String],

    mobile: {
      type: String,
      unique: true,
      sparse: true,
    },

    phone: String,

    email: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    image: [String],

    joinDate: Date,

    notes: String,

    memberRole: {
      type: String,
      enum: [
        "member",
        "president",
        "secretary",
        "treasurer",
        "vice-president",
        "assistant-secretary",
        "assistant-treasurer",
        "activity-coordinator",
        "committee-member",
        "internal-auditor"
      ],
      default: "member",
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

// // 🔹 Virtual full name
// memberSchema.virtual("fullName").get(function () {
//   return `${this.firstName} ${this.lastName}`;
// });

// // 🔹 Auto exclude deleted members
// memberSchema.pre(/^find/, function (next) {
//   this.where({ isDeleted: false });
//   next();
// });

const Member = mongoose.model("Member", memberSchema);
export default Member;
