import mongoose, { Schema } from "mongoose";

const purchaseSchema = new Schema({
  ownerId: { type: String, required: true, immutable: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  store: { type: String, default: "", trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: Number.MIN_VALUE },
  purchaseDate: { type: Date, required: true },
  warrantyEndDate: { type: Date, default: null },
  warrantyReminderDays: { type: Number, required: true, min: 0, max: 365 },
  notes: { type: String, default: "", maxlength: 2000 },
  receipt: {
    type: new Schema({
      fileId: { type: Schema.Types.ObjectId, required: true },
      filename: { type: String, required: true },
      contentType: { type: String, required: true },
      size: { type: Number, required: true },
    }, { _id: false }),
    default: null,
  },
}, { timestamps: true, collection: "wen_rahat_purchases" });

export const PurchaseModel = mongoose.model("WenRahatPurchase", purchaseSchema);
