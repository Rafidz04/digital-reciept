import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["superadmin"],
      default: "superadmin",
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("User", userSchema);
