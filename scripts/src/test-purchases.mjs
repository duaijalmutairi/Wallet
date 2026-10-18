import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

// Use an authenticated request adapter from a test harness for the full CRUD suite.
// Never introduce an authentication bypass into the running application for tests.
export async function testPurchases(request) {
// Run against the development proxy only. Creates and removes its own records.
const base = "http://localhost:80/api";
const ids = [];
const input = {
  name: "اختبار آلي للمشتريات", store: "متجر الاختبار", amount: 12.345,
  purchaseDate: "2026-01-01", warrantyEndDate: "2026-01-02", warrantyReminderDays: 30, notes: "",
};
const call = (path, method = "GET", data) => request(`${base}${path}`, {
  method,
  ...(data ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) } : {}),
});
const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
const sendFile = (id, bytes, name = "فاتورة.pdf", type = "application/pdf") => {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type }), name);
  return request(`${base}/purchases/${id}/receipt`, { method: "POST", body: form });
};
try {
  assert.equal((await call("/purchases", "POST", { ...input, purchaseDate: "2026-02-30" })).status, 400);
  assert.equal((await call("/purchases", "POST", { ...input, name: "  " })).status, 400);
  assert.equal((await call("/purchases", "POST", { ...input, warrantyEndDate: "2025-01-01" })).status, 400);
  assert.equal((await call("/purchases", "POST", { ...input, warrantyReminderDays: 1.5 })).status, 400);
  assert.equal((await call("/purchases/not-an-id/receipt")).status, 404);
  let response = await call("/purchases", "POST", input);
  assert.equal(response.status, 201);
  const purchase = await response.json();
  ids.push(purchase.id);
  assert.equal(purchase.warrantyStatus, "expired");
  assert.equal(purchase.receipt, null);
  assert.equal(purchase.purchaseDate, input.purchaseDate);
  assert.equal((await call(`/purchases/${purchase.id}/receipt`)).status, 404);
  response = await sendFile(purchase.id, pdf);
  assert.equal(response.status, 200, await response.clone().text());
  const attached = await response.json();
  assert.equal(attached.receipt.filename, "فاتورة.pdf");
  assert.equal(attached.receipt.size, pdf.length);
  assert.deepEqual(Buffer.from(await (await call(`/purchases/${purchase.id}/receipt`)).arrayBuffer()), pdf);
  assert.equal((await sendFile(purchase.id, Buffer.from("fake pdf"))).status, 415);
  assert.equal((await sendFile(purchase.id, pdf, "invoice.exe")).status, 415);
  assert.equal((await sendFile(purchase.id, Buffer.alloc(0))).status, 400);
  assert.equal((await sendFile(purchase.id, Buffer.alloc(10 * 1024 * 1024 + 1))).status, 413);
  assert.deepEqual(Buffer.from(await (await call(`/purchases/${purchase.id}/receipt`)).arrayBuffer()), pdf);
  response = await call(`/purchases/${purchase.id}`, "PUT", { ...input, name: "تم التعديل", warrantyEndDate: null });
  assert.equal(response.status, 200);
  const edited = await response.json();
  assert.equal(edited.warrantyStatus, "none");
  assert.equal(edited.receipt.filename, "فاتورة.pdf");
  assert.deepEqual(Buffer.from(await (await call(`/purchases/${purchase.id}/receipt`)).arrayBuffer()), pdf);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
  response = await sendFile(purchase.id, png, "receipt.png", "image/png");
  assert.equal(response.status, 200, await response.clone().text());
  assert.deepEqual(Buffer.from(await (await call(`/purchases/${purchase.id}/receipt`)).arrayBuffer()), png);
  response = await call(`/purchases/${purchase.id}/receipt`, "DELETE");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).receipt, null);
  assert.equal((await call(`/purchases/${purchase.id}/receipt`)).status, 404);
  assert.equal((await sendFile(purchase.id, pdf)).status, 200);
  const list = await (await call("/purchases")).json();
  assert.equal(list.find((p) => p.id === purchase.id).name, "تم التعديل");
  assert.equal((await call(`/purchases/${purchase.id}`, "DELETE")).status, 204);
  assert.equal((await call(`/purchases/${purchase.id}/receipt`)).status, 404);
  assert.equal((await call(`/purchases/${purchase.id}`, "PUT", input)).status, 404);
  console.log("PASS: purchase CRUD, real GridFS upload/download/replace/remove, invalid dates/types/size, rejected uploads retain bytes, warranty status.");
} finally {
  for (const id of ids) await call(`/purchases/${id}`, "DELETE");
}
}

// Standalone default validates the public boundary without reading credentials.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const id = "000000000000000000000000";
  for (const [path, methods] of [
    ["/purchases", ["GET", "POST"]],
    [`/purchases/${id}`, ["PUT", "DELETE"]],
    [`/purchases/${id}/receipt`, ["GET", "POST", "DELETE"]],
    ["/subscriptions", ["GET", "POST"]],
    [`/subscriptions/${id}`, ["GET", "PATCH", "DELETE"]],
  ]) {
    for (const method of methods) {
      const response = await fetch(`http://localhost:80/api${path}`, {
        method, headers: { "X-User-Id": "untrusted-user", "Authorization": "Bearer invalid" },
      });
      assert.equal(response.status, 401, `${method} ${path} must reject unverified identity`);
    }
  }
  assert.equal((await fetch("http://localhost:80/api/healthz")).status, 200);
  console.log("PASS: every purchase/subscription/receipt operation rejects anonymous or forged identity; health remains public.");
}
