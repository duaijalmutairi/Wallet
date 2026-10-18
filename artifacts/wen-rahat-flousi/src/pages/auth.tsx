import { SignIn, SignUp } from '@clerk/react';
import type { ReactNode } from 'react';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { basePath } from '@/lib/clerk';

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="flex min-h-[100dvh] flex-col">
      <header className="page-shell flex h-[76px] items-center justify-between">
        <Brand tagline="حسابك، واشتراكاتك" />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
    </div>
  );
}

export function SignInPage() {
  return (
    <AuthShell>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthShell>
  );
}

export function SignUpPage() {
  return (
    <AuthShell>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthShell>
  );
}
