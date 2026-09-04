import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: null },
    softDelete: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Menu", menuSchema);
