import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Subscription } from '@workspace/api-client-react';
import { Check, LoaderCircle, RefreshCw, Trash2, X } from 'lucide-react';

export type FormValues = { name: string; amount: string; billingCycle: 'monthly' | 'yearly'; renewalDate: string };
export const emptyForm: FormValues = { name: '', amount: '', billingCycle: 'monthly', renewalDate: '' };
export const toForm = (item: Subscription): FormValues => ({
  name: item.name, amount: String(item.amount), billingCycle: item.billingCycle, renewalDate: item.renewalDate.slice(0, 10),
});

const field = 'h-12 w-full rounded-[11px] border border-input bg-surface text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60';

type FormDialogProps = {
  editId: string | null;
  initial: FormValues;
  detail?: Subscription;
  detailLoading: boolean;
  detailError: boolean;
  onRetryDetail: () => void;
  saving: boolean;
  error: string;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
};

export function SubscriptionFormDialog({ editId, initial, detail, detailLoading, detailError, onRetryDetail, saving, error, onSubmit, onClose }: FormDialogProps) {
  const [form, setForm] = useState<FormValues>(initial);
  const [localError, setLocalError] = useState('');
  const hydratedFor = useRef<string | null>(null);
  const dirty = useRef(false);

  // Hydrate from fresh detail once per id, and never after the user started typing.
  useEffect(() => {
    if (!editId || !detail || detail.id !== editId) return;
    if (hydratedFor.current === editId || dirty.current) return;
    hydratedFor.current = editId;
    setForm(toForm(detail));
  }, [editId, detail]);

  const update = (patch: Partial<FormValues>) => { dirty.current = true; setForm((f) => ({ ...f, ...patch })); };
  const close = () => { if (!saving) onClose(); };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const amount = Number(form.amount);
    if (!form.name.trim() || !Number.isFinite(amount) || amount <= 0 || !form.renewalDate) {
      setLocalError('تأكد من إدخال الاسم والمبلغ وتاريخ التجديد بشكل صحيح.');
      return;
    }
    setLocalError('');
    onSubmit(form);
  };

  const shownError = localError || error;
  const blocking = !!editId && detailLoading && !detail;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="subscription-dialog-title" className="modal-card w-full max-w-[490px] rounded-t-[24px] border border-border bg-card p-6 text-card-foreground shadow-[0_24px_80px_hsl(176_40%_10%/.25)] sm:rounded-[24px] sm:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[.13em] text-accent">بيانات الاشتراك</p>
            <h2 id="subscription-dialog-title" className="mt-2 text-[22px] font-bold">{editId ? 'تعديل الاشتراك' : 'اشتراك جديد'}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">بس كم معلومة، وكل شي يصير واضح.</p>
          </div>
          <button type="button" data-testid="button-close-subscription-dialog" aria-label="إغلاق" disabled={saving} onClick={close} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"><X size={18} /></button>
        </div>

        {blocking ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-muted py-12 text-[13px] text-muted-foreground"><LoaderCircle className="animate-spin" size={17} /> جاري تحميل بيانات الاشتراك</div>
        ) : editId && detailError && !detail ? (
          <div className="rounded-xl bg-destructive/10 p-5 text-center">
            <p className="text-[13px] font-semibold text-destructive">ما قدرنا نجيب بيانات الاشتراك.</p>
            <button type="button" data-testid="button-retry-detail" onClick={onRetryDetail} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground"><RefreshCw size={13} /> حاول مرة ثانية</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <fieldset disabled={saving} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold">اسم الاشتراك</span>
                <input data-testid="input-subscription-name" autoFocus maxLength={100} required value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="مثال: منصة مشاهدة" className={`${field} px-3.5`} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold">المبلغ</span>
                  <div className="relative">
                    <input data-testid="input-subscription-amount" required type="number" min="0.001" step="0.001" value={form.amount} onChange={(e) => update({ amount: e.target.value })} placeholder="0.000" className={`font-latin ${field} px-3 pl-12`} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">د.ك</span>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold">دورة الفوترة</span>
                  <select data-testid="select-subscription-cycle" value={form.billingCycle} onChange={(e) => update({ billingCycle: e.target.value as FormValues['billingCycle'] })} className={`${field} px-3 text-[12px]`}>
                    <option value="monthly">شهري</option>
                    <option value="yearly">سنوي</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold">تاريخ التجديد القادم</span>
                <input data-testid="input-subscription-renewal-date" type="date" required value={form.renewalDate} onChange={(e) => update({ renewalDate: e.target.value })} className={`font-latin ${field} px-3.5`} />
              </label>
            </fieldset>
            {shownError && <p role="alert" data-testid="status-form-error" className="rounded-[10px] bg-destructive/10 px-3 py-2.5 text-[11px] font-medium text-destructive">{shownError}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" data-testid="button-cancel-subscription" disabled={saving} onClick={close} className="h-12 flex-1 rounded-[11px] border border-border text-[12px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50">إلغاء</button>
              <button type="submit" data-testid="button-save-subscription" disabled={saving} className="inline-flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-[11px] bg-primary text-[12px] font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-65">
                {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? 'جاري الحفظ' : editId ? 'حفظ التعديل' : 'إضافة الاشتراك'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export function DeleteDialog({ item, pending, error, onConfirm, onClose }: { item: Subscription; pending: boolean; error: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="modal-card w-full max-w-[410px] rounded-t-[24px] border border-border bg-card p-6 text-card-foreground shadow-[0_24px_80px_hsl(176_40%_10%/.25)] sm:rounded-[24px] sm:p-8">
        <div className="grid size-11 place-items-center rounded-[15px] bg-destructive/12 text-destructive"><Trash2 size={19} /></div>
        <h2 id="delete-dialog-title" className="mt-4 text-[20px] font-bold">تحذف هالاشتراك؟</h2>
        <p className="mt-2 text-[13px] leading-6 text-muted-foreground">راح ينحذف «{item.name}» من قائمتك. ما تقدر تتراجع عن هالخطوة.</p>
        {error && <p role="alert" data-testid="status-delete-error" className="mt-3 rounded-[10px] bg-destructive/10 px-3 py-2.5 text-[11px] text-destructive">ما قدرنا نحذف الاشتراك. حاول مرة ثانية.</p>}
        <div className="mt-6 flex gap-2">
          <button type="button" data-testid="button-cancel-delete" disabled={pending} onClick={onClose} className="h-11 flex-1 rounded-[11px] border border-border text-[12px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50">خلّه</button>
          <button type="button" data-testid="button-confirm-delete" disabled={pending} onClick={onConfirm} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[11px] bg-destructive text-[12px] font-bold text-destructive-foreground hover:brightness-110 disabled:opacity-60">
            {pending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {pending ? 'جاري الحذف' : 'إي، احذفه'}
          </button>
        </div>
      </section>
    </div>
  );
}
