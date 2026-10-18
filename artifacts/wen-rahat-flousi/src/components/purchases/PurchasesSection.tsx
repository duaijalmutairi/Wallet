import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getListPurchasesQueryKey, useDeletePurchase, useListPurchases } from '@workspace/api-client-react';
import type { Purchase } from '@workspace/api-client-react';
import { AlertCircle, AlertTriangle, Check, CirclePlus, FileText, LoaderCircle, Pencil, Plus, Receipt, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react';
import { PurchaseFormDialog } from './PurchaseFormDialog';
import { apiErrorMessage, formatDate, formatMoney, formatNumber, statusTone, warrantyLabel } from './purchase-utils';

type Dialog = { kind: 'form'; purchase: Purchase | null } | { kind: 'delete'; purchase: Purchase } | null;

export function PurchasesSection() {
  const queryClient = useQueryClient();
  const purchasesQuery = useListPurchases({
    query: { queryKey: getListPurchasesQueryKey(), refetchInterval: 5 * 60 * 1000, refetchOnWindowFocus: true },
  });
  const purchases = purchasesQuery.data ?? [];
  const deletePurchase = useDeletePurchase();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const alerts = purchases
    .filter((p) => p.warrantyStatus === 'expiring' || p.warrantyStatus === 'expired')
    .sort((a, b) => (a.warrantyDaysRemaining ?? 0) - (b.warrantyDaysRemaining ?? 0));

  const handleDelete = async () => {
    if (dialog?.kind !== 'delete') return;
    setDeleteError('');
    try {
      await deletePurchase.mutateAsync({ id: dialog.purchase.id });
      setDialog(null);
      setNotice('تم حذف المشتريات.');
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'ما قدرنا نحذف المشتريات. حاول مرة ثانية.'));
    } finally {
      void queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
    }
  };

  const openForm = (purchase: Purchase | null) => { setNotice(''); setDialog({ kind: 'form', purchase }); };

  return (
    <section className="mt-14 content-rise delay-two" id="purchases">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-.025em]">المشتريات والضمانات</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">الفواتير ومواعيد انتهاء الضمان، قبل لا تفوتك.</p>
        </div>
        <button type="button" data-testid="button-add-purchase" onClick={() => openForm(null)} className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#225d56] px-4 text-[12px] font-bold text-[#f7f1df] transition hover:bg-[#194e48] active:translate-y-px">
          <Plus size={16} /> أضف مشتريات
        </button>
      </div>

      {notice && (
        <div role="status" data-testid="status-purchase-success" className="mb-4 flex items-center gap-2 rounded-[12px] border border-[#c8d9ca] bg-[#edf4eb] px-4 py-3 text-[12px] font-medium text-[#315e4f]">
          <Check size={15} /> {notice}
          <button type="button" aria-label="إغلاق التنبيه" onClick={() => setNotice('')} className="mr-auto rounded p-1 hover:bg-[#dceadd]"><X size={14} /></button>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="content-rise mb-5 overflow-hidden rounded-[20px] border border-[#ecd2b4] bg-[#fcf3e6]" data-testid="list-warranty-alerts">
          <div className="flex items-center gap-2 border-b border-[#f0dcc3] px-5 py-3 text-[12px] font-bold text-[#8a5220]">
            <AlertTriangle size={15} /> تنبيهات الضمان
            <span className="font-latin mr-auto rounded-full bg-[#f3dcc0] px-2 py-0.5 text-[10px]">{formatNumber(alerts.length)}</span>
          </div>
          {alerts.map((p) => (
            <button type="button" key={p.id} data-testid={`alert-warranty-${p.id}`} onClick={() => openForm(p)} className="flex w-full items-center gap-3 border-b border-[#f3e3cf] px-5 py-3 text-right last:border-0 transition hover:bg-[#f9ebd8]">
              <span className={`size-2 shrink-0 rounded-full ${p.warrantyStatus === 'expired' ? 'bg-[#b04a37]' : 'bg-[#d38743]'}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{p.name}</span>
                <span className="block text-[10px] text-[#8a7560]">{p.warrantyStatus === 'expired' ? 'انتهى الضمان في' : 'ينتهي الضمان في'} {p.warrantyEndDate && formatDate(p.warrantyEndDate)}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusTone[p.warrantyStatus]}`}>{warrantyLabel(p)}</span>
            </button>
          ))}
        </div>
      )}

      {purchasesQuery.isLoading ? (
        <div className="overflow-hidden rounded-[20px] border border-[#e1d8c6] bg-[#faf7ef] p-5" aria-label="جار تحميل المشتريات">
          {[0, 1, 2].map((r) => (
            <div key={r} className="flex animate-pulse items-center gap-4 border-b border-[#eee8db] py-5 last:border-0">
              <div className="size-11 rounded-[14px] bg-[#e8e2d5]" />
              <div className="flex-1 space-y-2"><div className="h-3 w-32 rounded bg-[#e8e2d5]" /><div className="h-2.5 w-24 rounded bg-[#eee8db]" /></div>
              <div className="h-4 w-20 rounded bg-[#e8e2d5]" />
            </div>
          ))}
        </div>
      ) : purchasesQuery.isError ? (
        <div className="rounded-[20px] border border-[#e4c7bd] bg-[#fcf5f1] px-6 py-10 text-center" data-testid="state-purchases-error">
          <AlertCircle className="mx-auto text-[#b85d47]" size={24} />
          <p className="mt-3 font-semibold">تعذر تحميل المشتريات</p>
          <button type="button" data-testid="button-retry-purchases" onClick={() => void purchasesQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-[#225d56] px-4 py-2.5 text-[12px] font-semibold text-[#f7f1df]">
            <RefreshCw size={14} /> إعادة المحاولة
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#d6cebc] bg-[#faf7ef] px-6 py-12 text-center" data-testid="state-purchases-empty">
          <div className="mx-auto grid size-[54px] place-items-center rounded-[18px] bg-[#f4e6d6] text-[#a8682f]"><Receipt size={23} /></div>
          <p className="mt-4 text-[16px] font-bold">ما في مشتريات مسجلة</p>
          <p className="mt-2 text-[12px] leading-6 text-muted-foreground">احفظ فاتورة الجهاز وتاريخ الضمان، ونذكرك قبل لا ينتهي.</p>
          <button type="button" data-testid="button-add-first-purchase" onClick={() => openForm(null)} className="mt-5 inline-flex items-center gap-2 rounded-[11px] bg-[#225d56] px-4 py-3 text-[12px] font-bold text-[#f7f1df] transition hover:bg-[#194e48]">
            <CirclePlus size={16} /> أضف أول مشتريات
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-[#e1d8c6] bg-[#faf7ef]" data-testid="list-purchases">
          <div className="hidden grid-cols-[minmax(190px,1fr)_120px_130px_150px_82px] items-center border-b border-[#e7dfd0] px-6 py-3 text-[10px] font-semibold tracking-wide text-[#718078] md:grid">
            <span>المشتريات</span><span>المبلغ</span><span>تاريخ الشراء</span><span>الضمان</span><span className="text-center">إجراء</span>
          </div>
          {purchases.map((p) => (
            <article key={p.id} data-testid={`row-purchase-${p.id}`} className="subscription-row grid gap-3 border-b border-[#ebe4d8] px-4 py-4 last:border-0 sm:px-5 md:grid-cols-[minmax(190px,1fr)_120px_130px_150px_82px] md:items-center md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#f4e6d6] text-[#a8682f]">
                  {p.receipt ? <FileText size={17} /> : <Receipt size={17} />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold" data-testid={`text-purchase-name-${p.id}`}>{p.name}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{p.store || 'بدون محل'}{p.receipt ? ' · إيصال مرفق' : ''}<span className="md:hidden"> · {formatDate(p.purchaseDate)}</span></p>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 md:block">
                <span className="font-latin text-[14px] font-bold">{formatMoney(p.amount)}</span>
                <span className="text-[10px] text-muted-foreground"> د.ك</span>
              </div>
              <p className="hidden text-[11px] font-semibold md:block">{formatDate(p.purchaseDate)}</p>
              <div>
                <span data-testid={`status-warranty-${p.id}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${statusTone[p.warrantyStatus]}`}>
                  {p.warrantyStatus === 'active' && <ShieldCheck size={11} />}
                  {(p.warrantyStatus === 'expiring' || p.warrantyStatus === 'expired') && <AlertTriangle size={11} />}
                  {warrantyLabel(p)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-[#eee8dd] pt-2 md:justify-center md:border-0 md:pt-0">
                <button type="button" data-testid={`button-edit-purchase-${p.id}`} aria-label={`تعديل ${p.name}`} onClick={() => openForm(p)} className="icon-button grid size-9 place-items-center rounded-[10px] text-[#53726a] hover:bg-[#e7eee6] hover:text-[#245b52]"><Pencil size={15} /></button>
                <button type="button" data-testid={`button-delete-purchase-${p.id}`} aria-label={`حذف ${p.name}`} onClick={() => { setNotice(''); setDeleteError(''); setDialog({ kind: 'delete', purchase: p }); }} className="icon-button grid size-9 place-items-center rounded-[10px] text-[#9a7567] hover:bg-[#f7e8e1] hover:text-[#a64939]"><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog?.kind === 'form' && (
        <PurchaseFormDialog
          key={dialog.purchase?.id ?? 'new'}
          purchase={dialog.purchase}
          onClose={(message) => { setDialog(null); if (message) setNotice(message); }}
        />
      )}

      {dialog?.kind === 'delete' && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#172721]/45 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget && !deletePurchase.isPending) setDialog(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-purchase-title" className="modal-card w-full max-w-[410px] rounded-t-[24px] border border-[#e4dccb] bg-[#faf7ef] p-6 shadow-[0_24px_80px_rgba(24,50,43,.22)] sm:rounded-[24px] sm:p-8">
            <div className="grid size-11 place-items-center rounded-[15px] bg-[#f7e7df] text-[#ae5745]"><Trash2 size={19} /></div>
            <h2 id="delete-purchase-title" className="mt-4 text-[20px] font-bold">تحذف هالمشتريات؟</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">راح ينحذف «{dialog.purchase.name}»{dialog.purchase.receipt ? ' مع الإيصال المرفق' : ''}. ما تقدر تتراجع عن هالخطوة.</p>
            {deleteError && <p role="alert" data-testid="status-delete-purchase-error" className="mt-3 rounded-[10px] bg-[#f8eae4] px-3 py-2.5 text-[11px] text-[#9a4c3c]">{deleteError}</p>}
            <div className="mt-6 flex gap-2">
              <button type="button" data-testid="button-cancel-delete-purchase" disabled={deletePurchase.isPending} onClick={() => setDialog(null)} className="h-11 flex-1 rounded-[11px] border border-[#ddd5c5] text-[12px] font-semibold text-[#52675f] hover:bg-[#f0ebdf]">خلّه</button>
              <button type="button" data-testid="button-confirm-delete-purchase" disabled={deletePurchase.isPending} onClick={handleDelete} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#a94f3e] text-[12px] font-bold text-[#fff8f2] hover:bg-[#923f32] disabled:opacity-60">
                {deletePurchase.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deletePurchase.isPending ? 'جاري الحذف' : 'إي، احذفه'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
