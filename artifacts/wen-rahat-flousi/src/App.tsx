import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  getGetSubscriptionQueryKey,
  getListSubscriptionsQueryKey,
  useCreateSubscription,
  useDeleteSubscription,
  useGetSubscription,
  useListSubscriptions,
  useUpdateSubscription,
} from '@workspace/api-client-react';
import type { Subscription } from '@workspace/api-client-react';
import { AlertCircle, Check, CirclePlus, CreditCard, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';

type FormValues = {
  name: string;
  amount: string;
  billingCycle: 'monthly' | 'yearly';
  renewalDate: string;
};

type DialogState = { kind: 'form'; id: string | null } | { kind: 'delete'; item: Subscription } | null;

const queryClient = new QueryClient();
const emptyForm: FormValues = { name: '', amount: '', billingCycle: 'monthly', renewalDate: '' };

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ar-KW', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date.slice(0, 10)}T00:00:00`));

function AppContent() {
  const queryClient = useQueryClient();
  const subscriptionsQuery = useListSubscriptions();
  const subscriptions = (subscriptionsQuery.data ?? []) as Subscription[];
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const activeEditId = dialog?.kind === 'form' ? dialog.id : null;
  const subscriptionDetail = useGetSubscription(activeEditId ?? '', {
    query: {
      enabled: !!activeEditId,
      queryKey: getGetSubscriptionQueryKey(activeEditId ?? ''),
    },
  });

  useEffect(() => {
    if (dialog?.kind !== 'form' || !dialog.id || !subscriptionDetail.data) return;
    const item = subscriptionDetail.data as Subscription;
    if (item.id !== dialog.id) return;
    setForm({
      name: item.name,
      amount: String(item.amount),
      billingCycle: item.billingCycle,
      renewalDate: item.renewalDate.slice(0, 10),
    });
    setFormError('');
  }, [dialog, subscriptionDetail.data]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setNotice('');
    setDialog({ kind: 'form', id: null });
  };

  const openEdit = (item: Subscription) => {
    setForm({ name: item.name, amount: String(item.amount), billingCycle: item.billingCycle, renewalDate: item.renewalDate.slice(0, 10) });
    setFormError('');
    setNotice('');
    setDialog({ kind: 'form', id: item.id });
  };

  const dismissDialog = () => {
    setDialog(null);
    setFormError('');
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.name.trim() || !Number.isFinite(amount) || amount <= 0 || !form.renewalDate) {
      setFormError('تأكد من إدخال الاسم والمبلغ وتاريخ التجديد بشكل صحيح.');
      return;
    }
    setFormError('');
    const data = {
      name: form.name.trim(),
      amount,
      billingCycle: form.billingCycle,
      renewalDate: form.renewalDate,
    };

    if (dialog?.kind === 'form' && dialog.id) {
      updateSubscription.mutate(
        { id: dialog.id, data },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
            void queryClient.invalidateQueries({ queryKey: getGetSubscriptionQueryKey(dialog.id as string) });
            setDialog(null);
            setNotice('تم تحديث الاشتراك بنجاح.');
          },
          onError: () => setFormError('ما قدرنا نحفظ التعديل. حاول مرة ثانية.'),
        },
      );
    } else {
      createSubscription.mutate(
        { data },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
            setDialog(null);
            setNotice('تمت إضافة الاشتراك بنجاح.');
          },
          onError: () => setFormError('ما قدرنا نضيف الاشتراك. حاول مرة ثانية.'),
        },
      );
    }
  };

  const handleDelete = () => {
    if (dialog?.kind !== 'delete') return;
    deleteSubscription.mutate(
      { id: dialog.item.id },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetSubscriptionQueryKey(dialog.item.id) });
          setDialog(null);
          setNotice('تم حذف الاشتراك.');
        },
      },
    );
  };

  const saving = createSubscription.isPending || updateSubscription.isPending;

  return (
    <div dir="rtl" className="min-h-[100dvh] pb-16">
      <header className="header-line">
        <div className="page-shell flex h-[76px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[14px] bg-[#225d56] text-[#f7f1df]">
              <CreditCard size={19} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[17px] font-bold leading-tight">وين راحت فلوسي</p>
              <p className="mt-1 text-[11px] tracking-wide text-muted-foreground">اشتراكاتك، بمكان واحد</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#d8d1bf] bg-[#f6f1e6] px-3 py-2 text-[12px] font-medium text-[#315b53] sm:flex">
            <span className="size-1.5 rounded-full bg-[#d38743]" />
            إدارة الاشتراكات
          </div>
        </div>
      </header>

      <main className="page-shell pt-8 md:pt-12">
        <section className="hero-panel content-rise rounded-[28px] px-6 py-7 md:flex md:items-end md:justify-between md:px-10 md:py-9">
          <div className="max-w-[590px]">
            <div className="mb-4 flex items-center gap-2 text-[12px] font-medium text-[#c7d8cc]">
              <span className="h-px w-7 bg-[#d38a4d]" />
              مصاريفك الدورية أوضح
            </div>
            <h1 className="text-[29px] font-semibold leading-[1.35] tracking-[-.04em] md:text-[38px]">
              الاشتراكات اللي
              <br className="hidden sm:block" /> تتجدد من نفسها.
            </h1>
            <p className="mt-3 max-w-[420px] text-[13px] leading-7 text-[#d0dfd5] md:text-[14px]">
              سجّلها مرة، وخلك عارف شكثر تطلع عليك ومتى موعدها.
            </p>
          </div>
          <button
            type="button"
            data-testid="button-add-subscription"
            onClick={openCreate}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[13px] bg-[#e4a15f] px-5 text-[13px] font-bold text-[#263e36] transition hover:bg-[#efb477] active:translate-y-px md:mb-1 md:mt-0"
          >
            <Plus size={17} />
            أضف اشتراك
          </button>
        </section>

        <section className="mt-10 content-rise">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-.025em]">قائمة الاشتراكات</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">كل دفعة متكررة صارت بمكانها.</p>
            </div>
            {!subscriptionsQuery.isLoading && !subscriptionsQuery.isError && subscriptions.length > 0 && (
              <span className="rounded-full bg-[#eae4d7] px-3 py-1.5 text-[11px] font-semibold text-[#48645c]" data-testid="text-subscription-count">
                {new Intl.NumberFormat('ar-KW').format(subscriptions.length)} اشتراكات
              </span>
            )}
          </div>

          {notice && (
            <div role="status" data-testid="status-mutation-success" className="mb-4 flex items-center gap-2 rounded-[12px] border border-[#c8d9ca] bg-[#edf4eb] px-4 py-3 text-[12px] font-medium text-[#315e4f]">
              <Check size={15} /> {notice}
              <button type="button" aria-label="إغلاق التنبيه" onClick={() => setNotice('')} className="mr-auto rounded p-1 hover:bg-[#dceadd]"><X size={14} /></button>
            </div>
          )}

          {subscriptionsQuery.isLoading ? (
            <div className="overflow-hidden rounded-[20px] border border-[#e1d8c6] bg-[#faf7ef] p-5" aria-label="جار تحميل الاشتراكات">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex animate-pulse items-center gap-4 border-b border-[#eee8db] py-5 last:border-0">
                  <div className="size-11 rounded-[14px] bg-[#e8e2d5]" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-32 rounded bg-[#e8e2d5]" /><div className="h-2.5 w-24 rounded bg-[#eee8db]" /></div>
                  <div className="h-4 w-20 rounded bg-[#e8e2d5]" />
                </div>
              ))}
            </div>
          ) : subscriptionsQuery.isError ? (
            <div className="rounded-[20px] border border-[#e4c7bd] bg-[#fcf5f1] px-6 py-10 text-center" data-testid="state-subscriptions-error">
              <AlertCircle className="mx-auto text-[#b85d47]" size={24} />
              <p className="mt-3 font-semibold">تعذر تحميل الاشتراكات</p>
              <p className="mt-1 text-[12px] text-muted-foreground">تأكد من اتصالك وحاول مرة ثانية.</p>
              <button type="button" data-testid="button-retry-subscriptions" onClick={() => void subscriptionsQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-[#225d56] px-4 py-2.5 text-[12px] font-semibold text-[#f7f1df]">
                <RefreshCw size={14} /> إعادة المحاولة
              </button>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="relative overflow-hidden rounded-[22px] border border-dashed border-[#d6cebc] bg-[#faf7ef] px-6 py-12 text-center" data-testid="state-subscriptions-empty">
              <div className="mx-auto grid size-[54px] place-items-center rounded-[18px] bg-[#e8eee6] text-[#34675d]"><CreditCard size={23} /></div>
              <p className="mt-4 text-[16px] font-bold">ما سجلت أي اشتراك للحين</p>
              <p className="mt-2 text-[12px] leading-6 text-muted-foreground">خدمات البث، التطبيقات، والنادي — أضفها هنا عشان تعرف شكثر تكلفك.</p>
              <button type="button" data-testid="button-add-first-subscription" onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-[11px] bg-[#225d56] px-4 py-3 text-[12px] font-bold text-[#f7f1df] transition hover:bg-[#194e48]">
                <CirclePlus size={16} /> أضف أول اشتراك
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-[#e1d8c6] bg-[#faf7ef]" data-testid="list-subscriptions">
              <div className="hidden grid-cols-[minmax(190px,1fr)_135px_135px_130px_82px] items-center border-b border-[#e7dfd0] px-6 py-3 text-[10px] font-semibold tracking-wide text-[#718078] md:grid">
                <span>الاشتراك</span><span>التكلفة</span><span>الفوترة</span><span>التجديد القادم</span><span className="text-center">إجراء</span>
              </div>
              {subscriptions.map((item) => (
                  <article key={item.id} data-testid={`row-subscription-${item.id}`} className="subscription-row grid gap-3 border-b border-[#ebe4d8] px-4 py-4 last:border-0 sm:px-5 md:grid-cols-[minmax(190px,1fr)_135px_135px_130px_82px] md:items-center md:px-6 md:py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e8eee6] text-[13px] font-bold text-[#32645c]">
                        {item.name.trim().slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold" data-testid={`text-subscription-name-${item.id}`}>{item.name}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground md:hidden">{item.billingCycle === 'monthly' ? 'شهري' : 'سنوي'} · التجديد {formatDate(item.renewalDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5 md:block">
                      <span className="font-latin text-[14px] font-bold">{formatMoney(item.amount)}</span>
                      <span className="text-[10px] text-muted-foreground">د.ك / {item.billingCycle === 'monthly' ? 'شهر' : 'سنة'}</span>
                    </div>
                    <div className="hidden md:block">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf0e7] px-2.5 py-1.5 text-[10px] font-semibold text-[#476c5d]">
                        <RefreshCw size={11} /> {item.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                      </span>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[11px] font-semibold">{formatDate(item.renewalDate)}</p>
                    </div>
                    <div className="flex items-center justify-end gap-1 border-t border-[#eee8dd] pt-2 md:justify-center md:border-0 md:pt-0">
                      <button type="button" data-testid={`button-edit-subscription-${item.id}`} aria-label={`تعديل ${item.name}`} onClick={() => openEdit(item)} className="icon-button grid size-9 place-items-center rounded-[10px] text-[#53726a] hover:bg-[#e7eee6] hover:text-[#245b52]"><Pencil size={15} /></button>
                      <button type="button" data-testid={`button-delete-subscription-${item.id}`} aria-label={`حذف ${item.name}`} onClick={() => { setNotice(''); setDialog({ kind: 'delete', item }); }} className="icon-button grid size-9 place-items-center rounded-[10px] text-[#9a7567] hover:bg-[#f7e8e1] hover:text-[#a64939]"><Trash2 size={15} /></button>
                    </div>
                  </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {dialog?.kind === 'form' && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#172721]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) dismissDialog(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="subscription-dialog-title" className="modal-card w-full max-w-[490px] rounded-t-[24px] border border-[#e4dccb] bg-[#faf7ef] p-6 shadow-[0_24px_80px_rgba(24,50,43,.22)] sm:rounded-[24px] sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[.13em] text-[#b77943]">بيانات الاشتراك</p>
                <h2 id="subscription-dialog-title" className="mt-2 text-[22px] font-bold">{dialog.id ? 'تعديل الاشتراك' : 'اشتراك جديد'}</h2>
                <p className="mt-1 text-[12px] text-muted-foreground">بس كم معلومة، وكل شي يصير واضح.</p>
              </div>
              <button type="button" data-testid="button-close-subscription-dialog" aria-label="إغلاق" onClick={dismissDialog} className="grid size-9 place-items-center rounded-full text-[#66786f] hover:bg-[#ebe5d9]"><X size={18} /></button>
            </div>

            {dialog.id && subscriptionDetail.isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-[#f1eddf] py-12 text-[13px] text-muted-foreground"><LoaderCircle className="animate-spin" size={17} /> جاري تحميل بيانات الاشتراك</div>
            ) : dialog.id && subscriptionDetail.isError ? (
              <div className="rounded-xl bg-[#f8eae4] p-5 text-center">
                <p className="text-[13px] font-semibold text-[#9a4c3c]">ما قدرنا نجيب بيانات الاشتراك.</p>
                <button type="button" onClick={() => void subscriptionDetail.refetch()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#225d56] px-3 py-2 text-[11px] font-semibold text-white"><RefreshCw size={13} /> حاول مرة ثانية</button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold">اسم الاشتراك</span>
                  <input data-testid="input-subscription-name" autoFocus maxLength={100} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="مثال: منصة مشاهدة" className="h-12 w-full rounded-[11px] border border-[#ddd5c5] bg-[#fffdf8] px-3.5 text-[13px] outline-none transition placeholder:text-[#a8a295] focus:border-[#4d8174] focus:ring-2 focus:ring-[#4d8174]/15" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold">المبلغ</span>
                    <div className="relative">
                      <input data-testid="input-subscription-amount" required type="number" min="0.001" step="0.001" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.000" className="font-latin h-12 w-full rounded-[11px] border border-[#ddd5c5] bg-[#fffdf8] px-3 pl-12 text-[13px] outline-none transition placeholder:text-[#a8a295] focus:border-[#4d8174] focus:ring-2 focus:ring-[#4d8174]/15" />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#718078]">د.ك</span>
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-semibold">دورة الفوترة</span>
                    <select data-testid="select-subscription-cycle" value={form.billingCycle} onChange={(event) => setForm({ ...form, billingCycle: event.target.value as FormValues['billingCycle'] })} className="h-12 w-full rounded-[11px] border border-[#ddd5c5] bg-[#fffdf8] px-3 text-[12px] outline-none focus:border-[#4d8174] focus:ring-2 focus:ring-[#4d8174]/15">
                      <option value="monthly">شهري</option>
                      <option value="yearly">سنوي</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-[12px] font-semibold">تاريخ التجديد القادم</span>
                  <input data-testid="input-subscription-renewal-date" type="date" required value={form.renewalDate} onChange={(event) => setForm({ ...form, renewalDate: event.target.value })} className="font-latin h-12 w-full rounded-[11px] border border-[#ddd5c5] bg-[#fffdf8] px-3.5 text-[13px] outline-none focus:border-[#4d8174] focus:ring-2 focus:ring-[#4d8174]/15" />
                </label>
                {formError && <p role="alert" data-testid="status-form-error" className="rounded-[10px] bg-[#f8eae4] px-3 py-2.5 text-[11px] font-medium text-[#9a4c3c]">{formError}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="button" data-testid="button-cancel-subscription" onClick={dismissDialog} className="h-12 flex-1 rounded-[11px] border border-[#ddd5c5] text-[12px] font-semibold text-[#52675f] hover:bg-[#f0ebdf]">إلغاء</button>
                  <button type="submit" data-testid="button-save-subscription" disabled={saving || (dialog.id !== null && subscriptionDetail.isLoading)} className="inline-flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-[11px] bg-[#225d56] text-[12px] font-bold text-[#f7f1df] transition hover:bg-[#194e48] disabled:cursor-wait disabled:opacity-65">
                    {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                    {saving ? 'جاري الحفظ' : dialog.id ? 'حفظ التعديل' : 'إضافة الاشتراك'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {dialog?.kind === 'delete' && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#172721]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleteSubscription.isPending) dismissDialog(); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="modal-card w-full max-w-[410px] rounded-t-[24px] border border-[#e4dccb] bg-[#faf7ef] p-6 shadow-[0_24px_80px_rgba(24,50,43,.22)] sm:rounded-[24px] sm:p-8">
            <div className="grid size-11 place-items-center rounded-[15px] bg-[#f7e7df] text-[#ae5745]"><Trash2 size={19} /></div>
            <h2 id="delete-dialog-title" className="mt-4 text-[20px] font-bold">تحذف هالاشتراك؟</h2>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">راح ينحذف «{dialog.item.name}» من قائمتك. ما تقدر تتراجع عن هالخطوة.</p>
            {deleteSubscription.isError && <p role="alert" data-testid="status-delete-error" className="mt-3 rounded-[10px] bg-[#f8eae4] px-3 py-2.5 text-[11px] text-[#9a4c3c]">ما قدرنا نحذف الاشتراك. حاول مرة ثانية.</p>}
            <div className="mt-6 flex gap-2">
              <button type="button" data-testid="button-cancel-delete" disabled={deleteSubscription.isPending} onClick={dismissDialog} className="h-11 flex-1 rounded-[11px] border border-[#ddd5c5] text-[12px] font-semibold text-[#52675f] hover:bg-[#f0ebdf]">خلّه</button>
              <button type="button" data-testid="button-confirm-delete" disabled={deleteSubscription.isPending} onClick={handleDelete} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#a94f3e] text-[12px] font-bold text-[#fff8f2] hover:bg-[#923f32] disabled:opacity-60">
                {deleteSubscription.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deleteSubscription.isPending ? 'جاري الحذف' : 'إي، احذفه'}
              </button>
            </div>
          </section>
        </div>
      )}
      <footer className="page-shell mt-12 border-t border-[#ded6c6] pt-5 text-center text-[10px] text-[#858b7f]">وين راحت فلوسي · حساب أوضح، بدون تعقيد</footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
