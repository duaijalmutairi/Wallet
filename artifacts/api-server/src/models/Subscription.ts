import mongoose, { Schema, type InferSchemaType } from "mongoose";

const subscriptionSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: Number.MIN_VALUE },
    billingCycle: {
      type: String,
      required: true,
      enum: ["monthly", "yearly"],
    },
    renewalDate: { type: Date, required: true },
  },
  { timestamps: true, collection: "wen_rahat_subscriptions" },
);

subscriptionSchema.index({ ownerId: 1, renewalDate: 1 });

export type SubscriptionRecord = InferSchemaType<typeof subscriptionSchema>;

const SubscriptionModel =
  mongoose.models.Subscription ??
  mongoose.model("Subscription", subscriptionSchema);

export default SubscriptionModel;
