import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: "wen_rahat_users" },
);

export const UserModel =
  mongoose.models.WenRahatUser ?? mongoose.model("WenRahatUser", userSchema);
