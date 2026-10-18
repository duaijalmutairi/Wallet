import mongoose from "mongoose";
import { logger } from "./logger";

export const MAX_RECEIPT_SIZE = 10 * 1024 * 1024;

export function receiptBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection required");
  return new mongoose.mongo.GridFSBucket(db, { bucketName: "wen_rahat_receipts" });
}

// Cleanup must never turn a successfully committed metadata change into a reported
// failure (or delete a newly referenced file after an ambiguous database write).
export async function cleanupReceipt(id: mongoose.Types.ObjectId | undefined) {
  if (!id) return;
  try {
    await receiptBucket().delete(id);
  } catch (error) {
    logger.error({ err: error, fileId: id.toString() }, "Unreferenced receipt cleanup failed");
  }
}

export function receiptType(file: Express.Multer.File): string | null {
  const bytes = file.buffer;
  const ext = file.originalname.toLowerCase().split(".").pop();
  if (ext === "pdf" && file.mimetype === "application/pdf" &&
      bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) return "application/pdf";
  if ((ext === "jpg" || ext === "jpeg") && file.mimetype === "image/jpeg" &&
      bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (ext === "png" && file.mimetype === "image/png" &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  return null;
}
