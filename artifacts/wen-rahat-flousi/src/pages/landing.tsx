import { Link } from 'wouter';
import { ArrowLeft, BellRing, CalendarClock, LockKeyhole, Wallet } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';

const sample = [
  { n: 'منصة مشاهدة', a: '3.500', c: 'شهري', d: '14 مايو' },
  { n: 'تخزين سحابي', a: '0.990', c: 'شهري', d: '22 مايو' },
  { n: 'النادي الرياضي', a: '180.000', c: 'سنوي', d: '3 سبتمبر' },
];

export default function Landing() {
  return (
    <div dir="rtl" className="min-h-[100dvh] pb-10">
      <header className="header-line">
        <div className="page-shell flex h-[76px] items-center justify-between gap-3">
          <Brand />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in" data-testid="link-sign-in" className="hidden h-10 items-center rounded-[12px] px-4 text-[13px] font-semibold text-foreground hover:bg-muted sm:inline-flex">تسجيل الدخول</Link>
            <Link href="/sign-up" data-testid="link-sign-up-header" className="inline-flex h-10 items-center rounded-[12px] bg-primary px-4 text-[13px] font-bold text-primary-foreground hover:brightness-110">حساب جديد</Link>
          </div>
        </div>
      </header>

      <main className="page-shell pt-10 md:pt-16">
        <section className="grid items-center gap-10 md:grid-cols-[1.1fr_.9fr]">
          <div className="content-rise">
            <p className="mb-5 flex items-center gap-2 text-[12px] font-semibold text-accent"><span className="h-px w-8 bg-accent" /> لكل اللي يسأل آخر الشهر</p>
            <h1 className="text-[38px] font-bold leading-[1.25] tracking-[-.04em] md:text-[58px]">
              وين راحت<br /><span className="text-primary">فلوسي؟</span>
            </h1>
            <p className="mt-5 max-w-[460px] text-[15px] leading-8 text-muted-foreground">
              الاشتراكات الصغيرة تتراكم بهدوء. سجّلها هنا مرة وحدة، وشوف كم تطلع عليك فعلاً ومتى تتجدد — بالدينار، وبدون جداول.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sign-up" data-testid="link-get-started" className="inline-flex h-12 items-center gap-2 rounded-[13px] bg-accent px-6 text-[14px] font-bold text-accent-foreground transition hover:brightness-110">
                ابدأ الآن <ArrowLeft size={17} />
              </Link>
              <Link href="/sign-in" data-testid="link-sign-in-hero" className="inline-flex h-12 items-center rounded-[13px] border border-border bg-card px-6 text-[14px] font-semibold hover:bg-muted">عندي حساب</Link>
            </div>
          </div>

          <div className="content-rise delay-two">
            <div className="hero-panel rounded-[28px] p-6 md:p-7">
              <p className="text-[11px] text-hero-muted">مثال توضيحي — مجموع شهري تقريبي</p>
              <p className="mt-1 font-latin text-[34px] font-bold">19.490 <span className="font-sans text-[14px] font-medium text-hero-muted">د.ك</span></p>
              <div className="mt-5 space-y-2">
                {sample.map((s) => (
                  <div key={s.n} className="flex items-center justify-between rounded-[14px] bg-hero-foreground/8 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-[10px] bg-hero-foreground/12 text-[12px] font-bold">{s.n.slice(0, 1)}</span>
                      <div><p className="text-[13px] font-semibold">{s.n}</p><p className="text-[10px] text-hero-muted">{s.c} · {s.d}</p></div>
                    </div>
                    <span className="font-latin text-[13px] font-bold">{s.a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
          {[
            { i: Wallet, t: 'صورة أوضح للتكلفة', d: 'نحسب المكافئ الشهري للاشتراكات السنوية عشان تقارن تكاليفك بسهولة.' },
            { i: CalendarClock, t: 'موعد كل تجديد', d: 'تاريخ التجديد القادم جنب كل اشتراك، بدون ما تفتّش بالإيميلات.' },
            { i: LockKeyhole, t: 'قائمتك لك بس', d: 'كل حساب معزول. اشتراكاتك ما يشوفها أحد غيرك.' },
          ].map(({ i: Icon, t, d }, idx) => (
            <article key={t} className={`content-rise rounded-[22px] border border-border bg-card p-6 ${idx === 0 ? 'md:row-span-1' : ''}`}>
              <div className="grid size-10 place-items-center rounded-[12px] bg-primary/12 text-primary"><Icon size={18} /></div>
              <h3 className="mt-4 text-[16px] font-bold">{t}</h3>
              <p className="mt-2 text-[13px] leading-7 text-muted-foreground">{d}</p>
            </article>
          ))}
        </section>

        <section className="ledger-lines mt-16 flex flex-col items-start justify-between gap-5 rounded-[24px] border border-border bg-card px-6 py-8 md:flex-row md:items-center md:px-10">
          <div className="flex items-center gap-4">
            <BellRing className="text-accent" size={22} />
            <p className="text-[17px] font-bold">دقيقتين تسجيل، وتعرف وين راحت فلوسك.</p>
          </div>
          <Link href="/sign-up" data-testid="link-sign-up-footer" className="inline-flex h-11 items-center rounded-[12px] bg-primary px-5 text-[13px] font-bold text-primary-foreground hover:brightness-110">أنشئ حسابك</Link>
        </section>
      </main>
      <footer className="page-shell mt-12 border-t border-border pt-5 text-center text-[10px] text-muted-foreground">وين راحت فلوسي · حساب أوضح، بدون تعقيد</footer>
    </div>
  );
}
