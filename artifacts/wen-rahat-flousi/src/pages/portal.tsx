import { useClerk, useUser } from '@clerk/react';
import { LogOut } from 'lucide-react';
import { Brand } from '@/components/brand';
import { FullLoader } from '@/components/full-loader';
import { SubscriptionManager } from '@/components/subscription-manager';
import { ThemeToggle } from '@/components/theme-toggle';
import { basePath } from '@/lib/clerk';

export default function Portal() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  if (!isLoaded || !user) return <FullLoader />;
  const name = user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'حسابي';
  return (
    <div dir="rtl" className="min-h-[100dvh] pb-16">
      <header className="header-line">
        <div className="page-shell flex h-[76px] items-center justify-between gap-3">
          <Brand />
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-4 pr-1.5 sm:flex">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">{name.trim().slice(0, 1).toUpperCase()}</span>
              <span className="max-w-[160px] truncate text-[12px] font-semibold" data-testid="text-user-name">{name}</span>
            </div>
            <ThemeToggle />
            <button type="button" data-testid="button-sign-out" aria-label="تسجيل الخروج" title="تسجيل الخروج" onClick={() => void signOut({ redirectUrl: basePath || '/' })} className="icon-button inline-flex h-10 items-center gap-2 rounded-[12px] border border-border bg-card px-3 text-[12px] font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <LogOut size={16} /><span className="hidden md:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>
      <main className="page-shell pt-8 md:pt-12">
        <SubscriptionManager key={user.id} firstName={user.firstName} />
      </main>
      <footer className="page-shell mt-12 border-t border-border pt-5 text-center text-[10px] text-muted-foreground">وين راحت فلوسي · حساب أوضح، بدون تعقيد</footer>
    </div>
  );
}
