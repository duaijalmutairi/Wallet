import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import {
  CreateSubscriptionBody,
  CreateSubscriptionResponse,
  DeleteSubscriptionParams,
  GetSubscriptionParams,
  GetSubscriptionResponse,
  ListSubscriptionsResponse,
  UpdateSubscriptionBody,
  UpdateSubscriptionParams,
  UpdateSubscriptionResponse,
} from "@workspace/api-zod";
import { connectMongo } from "../lib/mongo";
import SubscriptionModel, {
  type SubscriptionRecord,
} from "../models/Subscription";

const router: IRouter = Router();

function toSubscriptionResponse(
  record: SubscriptionRecord & {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  },
) {
  return {
    id: record._id.toString(),
    name: record.name,
    amount: record.amount,
    billingCycle: record.billingCycle,
    renewalDate: record.renewalDate.toISOString().slice(0, 10),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

router.get("/subscriptions", async (req, res): Promise<void> => {
  await connectMongo();
  const records = await SubscriptionModel.find()
    .sort({ renewalDate: 1, name: 1 })
    .exec();
  const response = ListSubscriptionsResponse.parse(
    records.map((record) => toSubscriptionResponse(record)),
  );
  res.json(response);
});

router.post("/subscriptions", async (req, res): Promise<void> => {
  const parsed = CreateSubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.issues }, "Invalid subscription input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await connectMongo();
  const record = await SubscriptionModel.create(parsed.data);
  res
    .status(201)
    .json(CreateSubscriptionResponse.parse(toSubscriptionResponse(record)));
});

router.get("/subscriptions/:id", async (req, res): Promise<void> => {
  const params = GetSubscriptionParams.safeParse(req.params);
  if (!params.success || !mongoose.isValidObjectId(params.data?.id)) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  await connectMongo();
  const record = await SubscriptionModel.findById(params.data.id).exec();
  if (!record) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json(GetSubscriptionResponse.parse(toSubscriptionResponse(record)));
});

router.patch("/subscriptions/:id", async (req, res): Promise<void> => {
  const params = UpdateSubscriptionParams.safeParse(req.params);
  if (!params.success || !mongoose.isValidObjectId(params.data?.id)) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  const parsed = UpdateSubscriptionBody.safeParse(req.body);
  if (
    !parsed.success ||
    Object.keys(parsed.data ?? {}).length === 0
  ) {
    res.status(400).json({
      error: parsed.success ? "At least one field is required" : parsed.error.message,
    });
    return;
  }

  await connectMongo();
  const record = await SubscriptionModel.findByIdAndUpdate(
    params.data.id,
    parsed.data,
    { new: true, runValidators: true },
  ).exec();
  if (!record) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json(UpdateSubscriptionResponse.parse(toSubscriptionResponse(record)));
});

router.delete("/subscriptions/:id", async (req, res): Promise<void> => {
  const params = DeleteSubscriptionParams.safeParse(req.params);
  if (!params.success || !mongoose.isValidObjectId(params.data?.id)) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  await connectMongo();
  const record = await SubscriptionModel.findByIdAndDelete(params.data.id).exec();
  if (!record) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
