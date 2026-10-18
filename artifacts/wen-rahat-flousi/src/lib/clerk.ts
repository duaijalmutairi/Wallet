import { publishableKeyFromHost } from '@clerk/react/internal';
import { dark, shadcn } from '@clerk/themes';

export const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

export const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const palettes = {
  light: { primary: '#225d56', fg: '#1c3533', muted: '#5f7770', danger: '#b4473a', bg: '#faf7ef', input: '#fffdf8', neutral: '#1c3533' },
  dark: { primary: '#6cbcaf', fg: '#f1ebdc', muted: '#b9b2a2', danger: '#e08374', bg: '#1d302f', input: '#152423', neutral: '#f1ebdc' },
};

export function getClerkAppearance(mode: 'light' | 'dark') {
  const c = palettes[mode];
  return {
    theme: mode === 'dark' ? dark : shadcn,
    cssLayerName: 'clerk',
    options: {
      logoPlacement: 'inside' as const,
      logoLinkUrl: basePath || '/',
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
      socialButtonsPlacement: 'top' as const,
      socialButtonsVariant: 'blockButton' as const,
    },
    variables: {
      colorPrimary: c.primary,
      colorForeground: c.fg,
      colorMutedForeground: c.muted,
      colorDanger: c.danger,
      colorBackground: c.bg,
      colorInput: c.input,
      colorInputForeground: c.fg,
      colorNeutral: c.neutral,
      fontFamily: "'IBM Plex Sans Arabic', 'Manrope', sans-serif",
      borderRadius: '0.8rem',
    },
    elements: {
      rootBox: 'w-full flex justify-center',
      cardBox: 'bg-card border border-border rounded-[24px] w-[440px] max-w-full overflow-hidden shadow-[0_24px_70px_hsl(176_40%_12%/.16)]',
      card: '!shadow-none !border-0 !bg-transparent !rounded-none',
      footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
      headerTitle: 'text-foreground font-bold text-[21px]',
      headerSubtitle: 'text-muted-foreground text-[13px]',
      socialButtonsBlockButtonText: 'text-foreground font-semibold',
      formFieldLabel: 'text-foreground font-semibold text-[12px]',
      footerActionLink: 'text-primary font-bold',
      footerActionText: 'text-muted-foreground',
      dividerText: 'text-muted-foreground',
      identityPreviewEditButton: 'text-primary',
      formFieldSuccessText: 'text-success',
      alertText: 'text-destructive',
      logoBox: 'h-12 justify-center',
      logoImage: 'h-12 w-12',
      socialButtonsBlockButton: 'border border-border bg-surface rounded-[11px]',
      formButtonPrimary: 'bg-primary text-primary-foreground rounded-[11px] h-11 font-bold shadow-none',
      formFieldInput: 'bg-surface border border-border text-foreground rounded-[11px] h-11',
      footerAction: 'bg-transparent',
      dividerLine: 'bg-border',
      alert: 'bg-destructive/10 border border-destructive/25 rounded-[11px]',
      otpCodeFieldInput: 'border border-border bg-surface text-foreground',
      formFieldRow: 'gap-3',
      main: 'gap-5',
    },
  };
}
