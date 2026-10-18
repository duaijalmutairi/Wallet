import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { AlertCircle, Check, CirclePlus, CreditCard, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { DeleteDialog, SubscriptionFormDialog, emptyForm, toForm } from './subscription-dialogs';
import type { FormValues } from './subscription-dialogs';

type DialogState = { kind: 'form'; id: string | null; initial: FormValues } | { kind: 'delete'; item: Subscription } | null;

const formatMoney = (amount: number) => new Intl.NumberFormat('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount);
const formatDate = (date: string) => new Intl.DateTimeFormat('ar-KW', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date.slice(0, 10)}T00:00:00`));

export function SubscriptionManager({ firstName }: { firstName?: string | null }) {
  const queryClient = useQueryClient();
  const listQuery = useListSubscriptions();
  const subscriptions = (listQuery.data ?? []) as Subscription[];
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const inFlight = useRef(false);

  const editId = dialog?.kind === 'form' ? dialog.id : null;
  const detail = useGetSubscription(editId ?? '', { query: { enabled: !!editId, queryKey: getGetSubscriptionQueryKey(editId ?? ''), refetchOnWindowFocus: false } });

  const saving = createSubscription.isPending || updateSubscription.isPending;
  const monthlyTotal = subscriptions.reduce((s, i) => s + (i.billingCycle === 'monthly' ? i.amount : i.amount / 12), 0);

  const openCreate = () => { setFormError(''); setNotice(''); setDialog({ kind: 'form', id: null, initial: emptyForm }); };
  const openEdit = (item: Subscription) => { setFormError(''); setNotice(''); setDialog({ kind: 'form', id: item.id, initial: toForm(item) }); };
  const close = () => { if (saving || deleteSubscription.isPending) return; setDialog(null); setFormError(''); deleteSubscription.reset(); };

  const handleSave = (values: FormValues) => {
    if (inFlight.current || dialog?.kind !== 'form') return;
    inFlight.current = true;
    setFormError('');
    const data = { name: values.name.trim(), amount: Number(values.amount), billingCycle: values.billingCycle, renewalDate: values.renewalDate };
    const id = dialog.id;
    const done = () => { inFlight.current = false; };
    if (id) {
      updateSubscription.mutate({ id, data }, {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetSubscriptionQueryKey(id), updated);
          void queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
          setDialog(null); setNotice('تم تحديث الاشتراك بنجاح.');
        },
        onError: () => setFormError('ما قدرنا نحفظ التعديل. حاول مرة ثانية.'),
        onSettled: done,
      });
    } else {
      createSubscription.mutate({ data }, {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
          setDialog(null); setNotice('تمت إضافة الاشتراك بنجاح.');
        },
        onError: () => setFormError('ما قدرنا نضيف الاشتراك. حاول مرة ثانية.'),
        onSettled: done,
      });
    }
  };

  const handleDelete = () => {
    if (dialog?.kind !== 'delete' || deleteSubscription.isPending) return;
    const id = dialog.item.id;
    deleteSubscription.mutate({ id }, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: getGetSubscriptionQueryKey(id) });
        void queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        setDialog(null); setNotice('تم حذف الاشتراك.');
      },
    });
  };

  const ready = !listQuery.isLoading && !listQuery.isError;

  return (
    <>
      <section className="hero-panel content-rise rounded-[28px] px-6 py-7 md:flex md:items-end md:justify-between md:px-10 md:py-9">
        <div className="max-w-[590px]">
          <div className="mb-4 flex items-center gap-2 text-[12px] font-medium text-hero-muted">
            <span className="h-px w-7 bg-accent" />
            {firstName ? `هلا ${firstName}، هذي مصاريفك الدورية` : 'مصاريفك الدورية أوضح'}
          </div>
          <h1 className="text-[29px] font-semibold leading-[1.35] tracking-[-.04em] md:text-[38px]">
            الاشتراكات اللي
            <br className="hidden sm:block" /> تتجدد من نفسها.
          </h1>
          {ready && subscriptions.length > 0 ? (
            <p className="mt-3 text-[13px] text-hero-muted" data-testid="text-monthly-total">
              تقريباً <span className="font-latin text-[18px] font-bold text-hero-foreground">{formatMoney(monthlyTotal)}</span> د.ك تطلع عليك كل شهر.
            </p>
          ) : (
            <p className="mt-3 max-w-[420px] text-[13px] leading-7 text-hero-muted md:text-[14px]">سجّلها مرة، وخلك عارف شكثر تطلع عليك ومتى موعدها.</p>
          )}
        </div>
        <button type="button" data-testid="button-add-subscription" onClick={openCreate} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[13px] bg-accent px-5 text-[13px] font-bold text-accent-foreground transition hover:brightness-110 active:translate-y-px md:mb-1 md:mt-0">
          <Plus size={17} /> أضف اشتراك
        </button>
      </section>

      <section className="content-rise delay-one mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold tracking-[-.025em]">قائمة الاشتراكات</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">كل دفعة متكررة صارت بمكانها.</p>
          </div>
          {ready && subscriptions.length > 0 && (
            <span className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-secondary-foreground" data-testid="text-subscription-count">
              {new Intl.NumberFormat('ar-KW').format(subscriptions.length)} اشتراكات
            </span>
          )}
        </div>

        {notice && (
          <div role="status" data-testid="status-mutation-success" className="mb-4 flex items-center gap-2 rounded-[12px] border border-success/25 bg-success/10 px-4 py-3 text-[12px] font-medium text-success">
            <Check size={15} /> {notice}
            <button type="button" aria-label="إغلاق التنبيه" data-testid="button-dismiss-notice" onClick={() => setNotice('')} className="mr-auto rounded p-1 hover:bg-success/15"><X size={14} /></button>
          </div>
        )}

        {listQuery.isLoading ? (
          <div className="overflow-hidden rounded-[20px] border border-border bg-card p-5" aria-label="جار تحميل الاشتراكات">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex animate-pulse items-center gap-4 border-b border-border/70 py-5 last:border-0">
                <div className="size-11 rounded-[14px] bg-muted" />
                <div className="flex-1 space-y-2"><div className="h-3 w-32 rounded bg-muted" /><div className="h-2.5 w-24 rounded bg-muted/70" /></div>
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : listQuery.isError ? (
          <div className="rounded-[20px] border border-destructive/25 bg-destructive/5 px-6 py-10 text-center" data-testid="state-subscriptions-error">
            <AlertCircle className="mx-auto text-destructive" size={24} />
            <p className="mt-3 font-semibold">تعذر تحميل الاشتراكات</p>
            <p className="mt-1 text-[12px] text-muted-foreground">تأكد من اتصالك أو سجّل دخولك مرة ثانية.</p>
            <button type="button" data-testid="button-retry-subscriptions" onClick={() => void listQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12px] font-semibold text-primary-foreground">
              <RefreshCw size={14} className={listQuery.isFetching ? 'animate-spin' : ''} /> إعادة المحاولة
            </button>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="ledger-lines relative overflow-hidden rounded-[22px] border border-dashed border-border bg-card px-6 py-12 text-center" data-testid="state-subscriptions-empty">
            <div className="mx-auto grid size-[54px] place-items-center rounded-[18px] bg-primary/12 text-primary"><CreditCard size={23} /></div>
            <p className="mt-4 text-[16px] font-bold">ما سجلت أي اشتراك للحين</p>
            <p className="mt-2 text-[12px] leading-6 text-muted-foreground">خدمات البث، التطبيقات، والنادي — أضفها هنا عشان تعرف شكثر تكلفك.</p>
            <button type="button" data-testid="button-add-first-subscription" onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-[11px] bg-primary px-4 py-3 text-[12px] font-bold text-primary-foreground transition hover:brightness-110">
              <CirclePlus size={16} /> أضف أول اشتراك
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-border bg-card" data-testid="list-subscriptions">
            <div className="hidden grid-cols-[minmax(190px,1fr)_135px_135px_130px_82px] items-center border-b border-border px-6 py-3 text-[10px] font-semibold tracking-wide text-muted-foreground md:grid">
              <span>الاشتراك</span><span>التكلفة</span><span>الفوترة</span><span>التجديد القادم</span><span className="text-center">إجراء</span>
            </div>
            {subscriptions.map((item) => (
              <article key={item.id} data-testid={`row-subscription-${item.id}`} className="subscription-row grid gap-3 border-b border-border/70 px-4 py-4 last:border-0 sm:px-5 md:grid-cols-[minmax(190px,1fr)_135px_135px_130px_82px] md:items-center md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-primary/12 text-[13px] font-bold text-primary">{item.name.trim().slice(0, 1)}</div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold" data-testid={`text-subscription-name-${item.id}`}>{item.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground md:hidden">{item.billingCycle === 'monthly' ? 'شهري' : 'سنوي'} · التجديد {formatDate(item.renewalDate)}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 md:block">
                  <span className="font-latin text-[14px] font-bold" data-testid={`text-subscription-amount-${item.id}`}>{formatMoney(item.amount)}</span>
                  <span className="text-[10px] text-muted-foreground"> د.ك / {item.billingCycle === 'monthly' ? 'شهر' : 'سنة'}</span>
                </div>
                <div className="hidden md:block">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[10px] font-semibold text-secondary-foreground"><RefreshCw size={11} /> {item.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}</span>
                </div>
                <div className="hidden md:block"><p className="text-[11px] font-semibold">{formatDate(item.renewalDate)}</p></div>
                <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2 md:justify-center md:border-0 md:pt-0">
                  <button type="button" data-testid={`button-edit-subscription-${item.id}`} aria-label={`تعديل ${item.name}`} onClick={() => openEdit(item)} className="icon-button grid size-9 place-items-center rounded-[10px] text-muted-foreground hover:bg-primary/10 hover:text-primary"><Pencil size={15} /></button>
                  <button type="button" data-testid={`button-delete-subscription-${item.id}`} aria-label={`حذف ${item.name}`} onClick={() => { setNotice(''); deleteSubscription.reset(); setDialog({ kind: 'delete', item }); }} className="icon-button grid size-9 place-items-center rounded-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {dialog?.kind === 'form' && (
        <SubscriptionFormDialog
          key={dialog.id ?? 'new'}
          editId={dialog.id}
          initial={dialog.initial}
          detail={detail.data as Subscription | undefined}
          detailLoading={detail.isLoading}
          detailError={detail.isError}
          onRetryDetail={() => void detail.refetch()}
          saving={saving}
          error={formError}
          onSubmit={handleSave}
          onClose={close}
        />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteDialog item={dialog.item} pending={deleteSubscription.isPending} error={deleteSubscription.isError} onConfirm={handleDelete} onClose={close} />
      )}
    </>
  );
}
