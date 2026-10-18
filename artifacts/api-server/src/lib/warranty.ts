const DAY = 86_400_000;

export function warrantyState(end: Date | null | undefined, reminderDays: number, now = new Date()) {
  if (!end) return { warrantyStatus: "none" as const, warrantyDaysRemaining: null };
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuwait", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  const today = Date.parse(`${part("year")}-${part("month")}-${part("day")}T00:00:00Z`);
  const remaining = Math.round((Date.parse(end.toISOString().slice(0, 10)) - today) / DAY);
  return {
    warrantyStatus: remaining < 0 ? "expired" as const : remaining <= reminderDays ? "expiring" as const : "active" as const,
    warrantyDaysRemaining: remaining,
  };
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
