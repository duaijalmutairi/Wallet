import { useEffect, useRef } from 'react';
import { ClerkProvider, Show, useAuth, useClerk } from '@clerk/react';
import { arSA } from '@clerk/localizations';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { basePath, clerkProxyUrl, clerkPubKey, getClerkAppearance, stripBase } from '@/lib/clerk';
import Landing from '@/pages/landing';
import Portal from '@/pages/portal';
import { SignInPage, SignUpPage } from '@/pages/auth';
import NotFound from '@/pages/not-found';
import { FullLoader } from '@/components/full-loader';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <FullLoader label="جاري تحميل حسابك" />;
  return (
    <>
      <Show when="signed-in"><Redirect to="/user-portal" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function UserPortal() {
  const { isLoaded } = useAuth();
  if (!isLoaded) return <FullLoader label="جاري تحميل حسابك" />;
  return (
    <>
      <Show when="signed-in"><Portal /></Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { resolvedTheme } = useTheme();
  const appearance = getClerkAppearance(resolvedTheme === 'dark' ? 'dark' : 'light');

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={appearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/user-portal`}
      signUpFallbackRedirectUrl={`${basePath}/user-portal`}
      localization={{
        ...arSA,
        signIn: { ...arSA.signIn, start: { ...arSA.signIn?.start, title: 'هلا فيك من جديد', subtitle: 'سجّل دخولك وشوف وين راحت فلوسك' } },
        signUp: { ...arSA.signUp, start: { ...arSA.signUp?.start, title: 'افتح حسابك', subtitle: 'دقيقة وحدة وتبدأ تتابع اشتراكاتك' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/user-portal" component={UserPortal} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="wrf-theme">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
