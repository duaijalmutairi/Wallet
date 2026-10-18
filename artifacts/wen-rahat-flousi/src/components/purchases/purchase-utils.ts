import type { Purchase } from '@workspace/api-client-react';

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const RECEIPT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ar-KW', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date.slice(0, 10)}T00:00:00`));

export const formatNumber = (n: number) => new Intl.NumberFormat('ar-KW').format(n);

export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function validateReceipt(file: File): string | null {
  const name = file.name.toLowerCase();
  const typeOk = RECEIPT_TYPES.includes(file.type) || /\.(pdf|jpe?g|png)$/.test(name);
  if (!typeOk) return 'نوع الملف غير مدعوم. المسموح: PDF أو JPEG أو PNG.';
  if (file.size > MAX_RECEIPT_BYTES) return 'حجم الملف أكبر من 10 ميغابايت.';
  if (file.size === 0) return 'الملف فاضي.';
  return null;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { error?: unknown } } | null)?.data;
  if (data && typeof data.error === 'string' && data.error) return `${fallback} (${data.error})`;
  return fallback;
}

export function warrantyLabel(p: Purchase): string {
  const d = p.warrantyDaysRemaining;
  switch (p.warrantyStatus) {
    case 'none': return 'بدون ضمان';
    case 'expired': return d !== null && d < 0 ? `انتهى قبل ${formatNumber(Math.abs(d))} يوم` : 'الضمان منتهي';
    case 'expiring': return d === 0 ? 'ينتهي اليوم' : `باقي ${formatNumber(d ?? 0)} يوم`;
    default: return d !== null ? `ساري · باقي ${formatNumber(d)} يوم` : 'ساري';
  }
}

export const statusTone: Record<Purchase['warrantyStatus'], string> = {
  none: 'bg-[#eeeae0] text-[#6f766c]',
  active: 'bg-[#e6efe6] text-[#2f6555]',
  expiring: 'bg-[#f8ead8] text-[#9b5a1f]',
  expired: 'bg-[#f6e3dd] text-[#9a4434]',
};
