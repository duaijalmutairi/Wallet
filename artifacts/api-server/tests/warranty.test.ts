import assert from "node:assert/strict";
import { test } from "node:test";
import { isCalendarDate, warrantyState } from "../src/lib/warranty";

test("warranty calendar dates and Kuwait midnight boundaries", () => {
  assert.equal(isCalendarDate("2026-02-30"), false);
  assert.equal(isCalendarDate("2028-02-29"), true);
  assert.equal(isCalendarDate("2026-10-18T12:00:00Z"), false);
  assert.equal(isCalendarDate(null), false);
  const now = new Date("2026-10-18T20:59:59Z"); // Still Oct 18 in Kuwait
  assert.deepEqual(warrantyState(null, 30, now), { warrantyStatus: "none", warrantyDaysRemaining: null });
  const date = (s: string) => new Date(`${s}T00:00:00Z`);
  assert.deepEqual(warrantyState(date("2026-11-18"), 30, now), { warrantyStatus: "active", warrantyDaysRemaining: 31 });
  assert.deepEqual(warrantyState(date("2026-11-17"), 30, now), { warrantyStatus: "expiring", warrantyDaysRemaining: 30 });
  assert.deepEqual(warrantyState(date("2026-10-18"), 0, now), { warrantyStatus: "expiring", warrantyDaysRemaining: 0 });
  assert.deepEqual(warrantyState(date("2026-10-17"), 30, now), { warrantyStatus: "expired", warrantyDaysRemaining: -1 });
  assert.deepEqual(warrantyState(date("2026-10-18"), 0, new Date("2026-10-18T21:00:00Z")), { warrantyStatus: "expired", warrantyDaysRemaining: -1 });
});
