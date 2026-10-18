import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  downloadPurchaseReceipt,
  getListPurchasesQueryKey,
  useCreatePurchase,
  useDeletePurchaseReceipt,
  useUpdatePurchase,
  useUploadPurchaseReceipt,
} from '@workspace/api-client-react';
import type { Purchase } from '@workspace/api-client-react';
import { AlertCircle, Check, Download, FileText, LoaderCircle, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { apiErrorMessage, formatSize, validateReceipt } from './purchase-utils';

type Props = { purchase: Purchase | null; onClose: (message?: string) => void };

const inputCls = 'h-12 w-full rounded-[11px] border border-[#ddd5c5] bg-[#fffdf8] px-3.5 text-[13px] outline-none transition placeholder:text-[#a8a295] focus:border-[#4d8174] focus:ring-2 focus:ring-[#4d8174]/15 disabled:opacity-60';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuwait' }).format(new Date());

export function PurchaseFormDialog({ purchase, onClose }: Props) {
  const queryClient = useQueryClient();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const uploadReceipt = useUploadPurchaseReceipt();
  const deleteReceipt = useDeletePurchaseReceipt();
  const fileInput = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState<Purchase | null>(purchase);
  const [form, setForm] = useState({
    name: purchase?.name ?? '',
    store: purchase?.store ?? '',
    amount: purchase ? String(purchase.amount) : '',
    purchaseDate: purchase?.purchaseDate.slice(0, 10) ?? today(),
    hasWarranty: !!purchase?.warrantyEndDate,
    warrantyEndDate: purchase?.warrantyEndDate?.slice(0, 10) ?? '',
    warrantyReminderDays: String(purchase?.warrantyReminderDays ?? 30),
    notes: purchase?.notes ?? '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [uploadFailed, setUploadFailed] = useState('');
  const [phase, setPhase] = useState<'idle' | 'saving' | 'uploading' | 'deleting-receipt'>('idle');
  const [confirmReceiptDelete, setConfirmReceiptDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [info, setInfo] = useState('');

  const busy = phase !== 'idle';
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const pickFile = (f: File | null) => {
    setUploadFailed('');
    if (!f) { setFile(null); setFileError(''); return; }
    const err = validateReceipt(f);
    setFileError(err ?? '');
    setFile(err ? null : f);
    if (err && fileInput.current) fileInput.current.value = '';
  };

  const doUpload = async (id: string, f: File): Promise<Purchase | null> => {
    setPhase('uploading');
    try {
      const updated = await uploadReceipt.mutateAsync({ id, data: { file: f } });
      setSaved(updated);
      setFile(null);
      setUploadFailed('');
      if (fileInput.current) fileInput.current.value = '';
      return updated;
    } catch (err) {
      setUploadFailed(apiErrorMessage(err, saved?.receipt || purchase?.receipt ? 'فشل رفع الإيصال الجديد، والإيصال السابق ما زال محفوظ.' : 'فشل رفع الإيصال.'));
      return null;
    } finally {
      void refresh();
      setPhase('idle');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const amount = Number(form.amount);
    const days = Number(form.warrantyReminderDays);
    if (!form.name.trim() || !Number.isFinite(amount) || amount <= 0 || !form.purchaseDate) {
      setFormError('تأكد من الاسم والمبلغ وتاريخ الشراء.');
      return;
    }
    if (form.hasWarranty && (!form.warrantyEndDate || !Number.isInteger(days) || days < 0 || days > 365)) {
      setFormError('حدد تاريخ انتهاء الضمان، ومدة التنبيه بين 0 و 365 يوم.');
      return;
    }
    if (form.hasWarranty && form.warrantyEndDate < form.purchaseDate) {
      setFormError('تاريخ انتهاء الضمان لازم يكون بعد تاريخ الشراء.');
      return;
    }
    setFormError('');
    setInfo('');
    const data = {
      name: form.name.trim(),
      store: form.store.trim(),
      amount,
      purchaseDate: form.purchaseDate,
      warrantyEndDate: form.hasWarranty ? form.warrantyEndDate : null,
      warrantyReminderDays: form.hasWarranty ? days : 30,
      notes: form.notes.trim(),
    };
    setPhase('saving');
    let record: Purchase;
    try {
      record = saved
        ? await updatePurchase.mutateAsync({ id: saved.id, data })
        : await createPurchase.mutateAsync({ data });
      setSaved(record);
      void refresh();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'ما قدرنا نحفظ بيانات المشتريات. حاول مرة ثانية.'));
      setPhase('idle');
      return;
    }
    if (file) {
      const ok = await doUpload(record.id, file);
      if (ok) onClose(purchase ? 'تم تحديث المشتريات والإيصال.' : 'تمت إضافة المشتريات مع الإيصال.');
      return;
    }
    setPhase('idle');
    onClose(purchase ? 'تم تحديث المشتريات.' : 'تمت إضافة المشتريات.');
  };

  const retryUpload = async () => {
    if (!saved || !file || busy) return;
    const ok = await doUpload(saved.id, file);
    if (ok) setInfo('تم رفع الإيصال بنجاح.');
  };

  const handleDeleteReceipt = async () => {
    if (!saved) return;
    setPhase('deleting-receipt');
    try {
      const updated = await deleteReceipt.mutateAsync({ id: saved.id });
      setSaved(updated);
      setConfirmReceiptDelete(false);
      setInfo('تم حذف الإيصال.');
    } catch (err) {
      setDownloadError(apiErrorMessage(err, 'ما قدرنا نحذف الإيصال.'));
    } finally {
      void refresh();
      setPhase('idle');
    }
  };

  const handleDownload = async () => {
    if (!saved?.receipt) return;
    setDownloading(true);
    setDownloadError('');
    try {
      const blob = await downloadPurchaseReceipt(saved.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = saved.receipt.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDownloadError(apiErrorMessage(err, 'ما قدرنا ننزّل الإيصال.'));
    } finally {
      setDownloading(false);
    }
  };

  const close = () => {
    if (busy) return;
    onClose(saved && !purchase ? 'تم حفظ المشتريات بدون إيصال.' : undefined);
  };

  const receipt = saved?.receipt ?? null;
  const metadataSavedUploadFailed = !!uploadFailed && !!saved;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#172721]/45 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="purchase-dialog-title" className="modal-card max-h-[94dvh] w-full max-w-[540px] overflow-y-auto rounded-t-[24px] border border-[#e4dccb] bg-[#faf7ef] p-6 shadow-[0_24px_80px_rgba(24,50,43,.22)] sm:rounded-[24px] sm:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[.13em] text-[#b77943]">فاتورة وضمان</p>
            <h2 id="purchase-dialog-title" className="mt-2 text-[22px] font-bold">{purchase ? 'تعديل المشتريات' : saved ? 'المشتريات محفوظة' : 'مشتريات جديدة'}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">الفاتورة وتاريخ الضمان، بمكان واحد.</p>
          </div>
          <button type="button" data-testid="button-close-purchase-dialog" aria-label="إغلاق" disabled={busy} onClick={close} className="grid size-9 place-items-center rounded-full text-[#66786f] hover:bg-[#ebe5d9] disabled:cursor-not-allowed disabled:opacity-40"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={busy} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold">اسم المنتج</span>
              <input data-testid="input-purchase-name" autoFocus maxLength={100} required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="مثال: غسالة ملابس" className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold">المحل</span>
                <input data-testid="input-purchase-store" maxLength={100} value={form.store} onChange={(e) => set({ store: e.target.value })} placeholder="اختياري" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold">المبلغ</span>
                <div className="relative">
                  <input data-testid="input-purchase-amount" required type="number" min="0.001" step="0.001" value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0.000" className={`font-latin pl-12 ${inputCls}`} />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#718078]">د.ك</span>
                </div>
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold">تاريخ الشراء</span>
              <input data-testid="input-purchase-date" type="date" required value={form.purchaseDate} onChange={(e) => set({ purchaseDate: e.target.value })} className={`font-latin ${inputCls}`} />
            </label>

            <div className="rounded-[14px] border border-[#e4dccb] bg-[#f4efe3] p-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-[12px] font-semibold">
                <input data-testid="checkbox-purchase-warranty" type="checkbox" checked={form.hasWarranty} onChange={(e) => set({ hasWarranty: e.target.checked })} className="size-4 accent-[#225d56]" />
                عليه ضمان
              </label>
              {form.hasWarranty && (
                <div className="content-rise mt-3 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold">ينتهي الضمان في</span>
                    <input data-testid="input-warranty-end-date" type="date" required min={form.purchaseDate} value={form.warrantyEndDate} onChange={(e) => set({ warrantyEndDate: e.target.value })} className={`font-latin ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold">نبهني قبلها بـ (يوم)</span>
                    <input data-testid="input-warranty-reminder-days" type="number" required min={0} max={365} step={1} value={form.warrantyReminderDays} onChange={(e) => set({ warrantyReminderDays: e.target.value })} className={`font-latin ${inputCls}`} />
                  </label>
                </div>
              )}
            </div>

            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold">ملاحظات</span>
              <textarea data-testid="input-purchase-notes" maxLength={2000} rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="رقم تسلسلي، رقم خدمة العملاء..." className="w-full rounded-[11px] border border-[#ddd5c5] bg-[#fffdf8] px-3.5 py-3 text-[13px] outline-none placeholder:text-[#a8a295] focus:border-[#4d8174] focus:ring-2 focus:ring-[#4d8174]/15" />
            </label>

            <div>
              <span className="mb-2 block text-[12px] font-semibold">الإيصال</span>
              {receipt && (
                <div className="mb-2 flex items-center gap-3 rounded-[12px] border border-[#dfd7c6] bg-[#fffdf8] px-3 py-2.5" data-testid="text-current-receipt">
                  <FileText size={17} className="shrink-0 text-[#34675d]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-latin truncate text-[12px] font-semibold" dir="ltr">{receipt.filename}</p>
                    <p className="font-latin text-[10px] text-muted-foreground">{formatSize(receipt.size)}</p>
                  </div>
                  <button type="button" data-testid="button-download-receipt" onClick={handleDownload} disabled={downloading} className="icon-button grid size-8 place-items-center rounded-[9px] text-[#53726a] hover:bg-[#e7eee6]" aria-label="تنزيل الإيصال">{downloading ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}</button>
                  <button type="button" data-testid="button-delete-receipt" onClick={() => setConfirmReceiptDelete(true)} className="icon-button grid size-8 place-items-center rounded-[9px] text-[#9a7567] hover:bg-[#f7e8e1]" aria-label="حذف الإيصال"><Trash2 size={14} /></button>
                </div>
              )}
              {confirmReceiptDelete && receipt && (
                <div role="alert" className="content-rise mb-2 rounded-[12px] border border-[#e8c9bd] bg-[#fbf0eb] p-3 text-[12px]">
                  <p className="font-semibold text-[#9a4c3c]">تحذف الإيصال؟ ما تقدر تتراجع.</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" data-testid="button-cancel-delete-receipt" onClick={() => setConfirmReceiptDelete(false)} className="rounded-[9px] border border-[#ddd5c5] px-3 py-1.5 text-[11px] font-semibold">خلّه</button>
                    <button type="button" data-testid="button-confirm-delete-receipt" onClick={handleDeleteReceipt} className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#a94f3e] px-3 py-1.5 text-[11px] font-bold text-[#fff8f2]">
                      {phase === 'deleting-receipt' && <LoaderCircle size={12} className="animate-spin" />} إي، احذفه
                    </button>
                  </div>
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-dashed border-[#cfc6b2] bg-[#fffdf8] px-3 py-3 text-[12px] transition hover:border-[#4d8174]">
                <Upload size={16} className="shrink-0 text-[#b77943]" />
                <span className="min-w-0 flex-1 truncate" data-testid="text-selected-receipt">
                  {file ? <span className="font-latin" dir="ltr">{file.name} · {formatSize(file.size)}</span> : receipt ? 'استبدل الإيصال (PDF أو JPEG أو PNG، حتى 10MB)' : 'أرفق الإيصال (PDF أو JPEG أو PNG، حتى 10MB)'}
                </span>
                <input ref={fileInput} data-testid="input-receipt-file" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
              </label>
              {file && !busy && <button type="button" data-testid="button-clear-receipt-file" onClick={() => { pickFile(null); if (fileInput.current) fileInput.current.value = ''; }} className="mt-1.5 text-[11px] font-semibold text-[#8a6f62] underline-offset-2 hover:underline">إلغاء اختيار الملف</button>}
              {fileError && <p role="alert" data-testid="status-file-error" className="mt-2 text-[11px] font-medium text-[#9a4c3c]">{fileError}</p>}
              {downloadError && <p role="alert" data-testid="status-receipt-error" className="mt-2 text-[11px] font-medium text-[#9a4c3c]">{downloadError}</p>}
            </div>
          </fieldset>

          {metadataSavedUploadFailed && (
            <div role="alert" data-testid="status-upload-failed" className="content-rise mt-4 rounded-[12px] border border-[#ecc9a8] bg-[#fcf1e4] p-4 text-[12px] leading-6 text-[#7d4b1c]">
              <p className="flex items-center gap-2 font-bold"><AlertCircle size={15} /> بيانات المشتريات انحفظت، لكن رفع الإيصال فشل.</p>
              <p className="mt-1">{uploadFailed} الملف المختار ما زال جاهز، تقدر تعيد المحاولة بدون ما تنضاف المشتريات مرة ثانية.</p>
              <button type="button" data-testid="button-retry-upload" disabled={busy || !file} onClick={retryUpload} className="mt-3 inline-flex items-center gap-2 rounded-[10px] bg-[#225d56] px-3.5 py-2 text-[11px] font-bold text-[#f7f1df] disabled:opacity-60">
                {phase === 'uploading' ? <LoaderCircle size={13} className="animate-spin" /> : <RefreshCw size={13} />} إعادة رفع الإيصال
              </button>
            </div>
          )}
          {formError && <p role="alert" data-testid="status-purchase-form-error" className="mt-4 rounded-[10px] bg-[#f8eae4] px-3 py-2.5 text-[11px] font-medium text-[#9a4c3c]">{formError}</p>}
          {info && <p role="status" data-testid="status-purchase-info" className="mt-4 flex items-center gap-2 rounded-[10px] bg-[#edf4eb] px-3 py-2.5 text-[11px] font-medium text-[#315e4f]"><Check size={13} /> {info}</p>}

          <div className="mt-5 flex gap-2">
            <button type="button" data-testid="button-cancel-purchase" disabled={busy} onClick={close} className="h-12 flex-1 rounded-[11px] border border-[#ddd5c5] text-[12px] font-semibold text-[#52675f] hover:bg-[#f0ebdf] disabled:opacity-50">{saved && !purchase ? 'إغلاق' : 'إلغاء'}</button>
            <button type="submit" data-testid="button-save-purchase" disabled={busy} className="inline-flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-[11px] bg-[#225d56] text-[12px] font-bold text-[#f7f1df] transition hover:bg-[#194e48] disabled:cursor-wait disabled:opacity-65">
              {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
              {phase === 'saving' ? 'جاري حفظ البيانات' : phase === 'uploading' ? 'جاري رفع الإيصال' : phase === 'deleting-receipt' ? 'جاري الحذف' : saved ? 'حفظ' : 'إضافة المشتريات'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
