import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    items: { type: [orderItemSchema], required: true },
    totalQty: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    whatsappTo: { type: String, default: "6281511003770" },
    whatsappStatus: {
      type: String,
      enum: ["not_sent", "sent", "failed"],
      default: "not_sent"
    },
    whatsappMessageId: { type: String, default: null },
    whatsappSentAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Order", orderSchema);
