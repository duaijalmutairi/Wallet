import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { connectMongo } from "../lib/mongo";
import { UserModel } from "../models/User";

/** Identity always comes from the verified session, never a request parameter. */
export const requireAccount: RequestHandler = async (req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  res.vary("Cookie");
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "يلزم تسجيل الدخول للوصول إلى بياناتك." });
    return;
  }

  await connectMongo();
  try {
    await UserModel.updateOne(
      { clerkId: userId },
      { $setOnInsert: { clerkId: userId } },
      { upsert: true },
    );
  } catch (error) {
    // Concurrent first requests can race to create the same unique account.
    if (!(error instanceof Error && "code" in error && error.code === 11000)) {
      throw error;
    }
  }
  res.locals.ownerId = userId;
  next();
};
