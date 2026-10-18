import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { CreatePurchaseBody, CreatePurchaseResponse, ListPurchasesResponse } from "@workspace/api-zod";
import { connectMongo } from "../lib/mongo";
import { PurchaseModel } from "../models/Purchase";
import { isCalendarDate, warrantyState } from "../lib/warranty";
import { cleanupReceipt, MAX_RECEIPT_SIZE, receiptBucket, receiptType } from "../lib/receipts";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: {
  fileSize: MAX_RECEIPT_SIZE, files: 1, fields: 0, parts: 1,
} }).single("file");

function serialize(record: InstanceType<typeof PurchaseModel>) {
  return {
    id: record._id.toString(), name: record.name, store: record.store,
    amount: record.amount, purchaseDate: record.purchaseDate.toISOString().slice(0, 10),
    warrantyEndDate: record.warrantyEndDate?.toISOString().slice(0, 10) ?? null,
    warrantyReminderDays: record.warrantyReminderDays, notes: record.notes,
    receipt: record.receipt ? {
      filename: record.receipt.filename, contentType: record.receipt.contentType, size: record.receipt.size,
    } : null,
    ...warrantyState(record.warrantyEndDate, record.warrantyReminderDays),
    createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString(),
  };
}

router.get("/purchases", async (_req, res): Promise<void> => {
  await connectMongo();
  const records = await PurchaseModel.find({ ownerId: res.locals.ownerId }).sort({ purchaseDate: -1, _id: -1 });
  const response = records.map(serialize);
  ListPurchasesResponse.parse(response);
  res.json(response);
});

function validateBody(req: Request, res: Response, next: NextFunction): void {
  const parsed = CreatePurchaseBody.safeParse(req.body);
  if (!parsed.success || !isCalendarDate(req.body.purchaseDate) ||
      (req.body.warrantyEndDate !== null && !isCalendarDate(req.body.warrantyEndDate)) ||
      !parsed.data.name.trim() || !Number.isFinite(parsed.data.amount) ||
      (parsed.data.warrantyEndDate && parsed.data.warrantyEndDate < parsed.data.purchaseDate)) {
    res.status(400).json({ error: "تحقق من البيانات والتواريخ؛ انتهاء الضمان لا يسبق الشراء." });
    return;
  }
  req.body = parsed.data;
  next();
}

router.post("/purchases", validateBody, async (req, res): Promise<void> => {
  await connectMongo();
  const record = await PurchaseModel.create({ ...req.body, ownerId: res.locals.ownerId });
  const response = serialize(record);
  CreatePurchaseResponse.parse(response);
  res.status(201).json(response);
});

router.use("/purchases/:id", (req, res, next): void => {
  if (typeof req.params.id !== "string" || !mongoose.isObjectIdOrHexString(req.params.id)) {
    res.status(404).json({ error: "المشتريات غير موجودة." });
    return;
  }
  res.locals.purchaseId = req.params.id;
  next();
});

router.put("/purchases/:id", validateBody, async (req, res): Promise<void> => {
  await connectMongo();
  const record = await PurchaseModel.findOneAndUpdate({ _id: res.locals.purchaseId, ownerId: res.locals.ownerId }, { $set: req.body }, { returnDocument: "after", runValidators: true });
  if (!record) { res.status(404).json({ error: "المشتريات غير موجودة." }); return; }
  res.json(serialize(record));
});

router.delete("/purchases/:id", async (_req, res): Promise<void> => {
  await connectMongo();
  const record = await PurchaseModel.findOneAndDelete({ _id: res.locals.purchaseId, ownerId: res.locals.ownerId });
  if (!record) { res.status(404).json({ error: "المشتريات غير موجودة." }); return; }
  await cleanupReceipt(record.receipt?.fileId);
  res.sendStatus(204);
});

router.post("/purchases/:id/receipt", async (_req, res, next): Promise<void> => {
  await connectMongo();
  if (!await PurchaseModel.exists({ _id: res.locals.purchaseId, ownerId: res.locals.ownerId })) {
    res.status(404).json({ error: "المشتريات غير موجودة." });
    return;
  }
  next();
}, (req, res, next): void => {
  upload(req, res, (error: unknown) => {
    if (error) {
      const tooLarge = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
      res.status(tooLarge ? 413 : 400).json({
        error: tooLarge ? "حجم الفاتورة يجب ألا يتجاوز 10 ميجابايت." : "تعذر الرفع. اختر ملفًا واحدًا فقط في حقل file.",
      });
      return;
    }
    next();
  });
}, async (req, res): Promise<void> => {
  if (!req.file || req.file.size === 0) { res.status(400).json({ error: "اختر فاتورة غير فارغة." }); return; }
  const contentType = receiptType(req.file);
  if (!contentType) { res.status(415).json({ error: "الفاتورة يجب أن تكون PDF أو JPEG أو PNG مطابقًا لمحتواه." }); return; }
  await connectMongo();
  const record = await PurchaseModel.findOne({ _id: res.locals.purchaseId, ownerId: res.locals.ownerId });
  if (!record) { res.status(404).json({ error: "المشتريات غير موجودة." }); return; }
  // Multipart filenames arrive as latin1; restore browser UTF-8 names.
  const filename = Buffer.from(req.file.originalname, "latin1").toString("utf8")
    .replace(/[/\\\x00-\x1f\x7f]/g, "_").slice(0, 180) || "receipt";
  const stream = receiptBucket().openUploadStream(filename, { metadata: { contentType, purchaseId: record._id, ownerId: res.locals.ownerId } });
  try {
    await pipeline(Readable.from(req.file.buffer), stream);
  } catch (error) {
    await cleanupReceipt(stream.id);
    throw error;
  }
  // Compare-and-swap prevents concurrent replacement/deletion from losing files.
  // If a database write throws, retain bytes: its outcome may be ambiguous.
  const updated = await PurchaseModel.findOneAndUpdate({
    _id: record._id, ownerId: res.locals.ownerId, "receipt.fileId": record.receipt?.fileId ?? { $exists: false },
  }, { $set: { receipt: { fileId: stream.id, filename, contentType, size: req.file.size } } }, { returnDocument: "after" });
  if (!updated) {
    await cleanupReceipt(stream.id);
    res.status(409).json({ error: "تغيرت الفاتورة أثناء الرفع. حدّث القائمة ثم حاول مجددًا." });
    return;
  }
  await cleanupReceipt(record.receipt?.fileId);
  res.json(serialize(updated));
});

router.get("/purchases/:id/receipt", async (req, res): Promise<void> => {
  await connectMongo();
  const record = await PurchaseModel.findOne({ _id: res.locals.purchaseId, ownerId: res.locals.ownerId });
  if (!record?.receipt) { res.status(404).json({ error: "الفاتورة غير موجودة." }); return; }
  const bucket = receiptBucket();
  const file = await bucket.find({ _id: record.receipt.fileId }).next();
  if (!file) { res.status(404).json({ error: "ملف الفاتورة غير موجود." }); return; }
  res.set({
    "Content-Type": record.receipt.contentType,
    "Content-Length": String(file.length),
    "Content-Disposition": `attachment; filename="receipt"; filename*=UTF-8''${encodeURIComponent(record.receipt.filename)}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  });
  try {
    await pipeline(bucket.openDownloadStream(record.receipt.fileId), res);
  } catch (error) {
    req.log.error({ err: error }, "Receipt download interrupted");
    if (!res.headersSent && !res.destroyed) res.status(500).end();
  }
});

router.delete("/purchases/:id/receipt", async (_req, res): Promise<void> => {
  await connectMongo();
  const record = await PurchaseModel.findOneAndUpdate(
    { _id: res.locals.purchaseId, ownerId: res.locals.ownerId }, { $set: { receipt: null } }, { returnDocument: "before" },
  );
  if (!record) { res.status(404).json({ error: "المشتريات غير موجودة." }); return; }
  await cleanupReceipt(record.receipt?.fileId);
  record.receipt = null;
  res.json(serialize(record));
});

export default router;
