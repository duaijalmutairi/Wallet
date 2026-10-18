import { Link } from 'wouter';
import { Compass } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function NotFound() {
  return (
    <div dir="rtl" className="relative grid min-h-[100dvh] place-items-center px-6">
      <div className="absolute left-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-[420px] rounded-[24px] border border-border bg-card p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-[16px] bg-accent/15 text-accent"><Compass size={22} /></div>
        <p className="mt-4 font-latin text-[13px] font-bold text-muted-foreground">404</p>
        <h1 className="mt-1 text-[22px] font-bold">الصفحة مو موجودة</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">يمكن الرابط تغيّر. ارجع للبداية وكمّل من هناك.</p>
        <Link href="/" data-testid="link-back-home" className="mt-6 inline-flex h-11 items-center rounded-[12px] bg-primary px-5 text-[13px] font-bold text-primary-foreground">الرئيسية</Link>
      </div>
    </div>
  );
}
