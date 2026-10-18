import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ onHero = false }: { onHero?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      data-testid="button-toggle-theme"
      aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`icon-button grid size-10 place-items-center rounded-[12px] border transition ${onHero ? 'border-hero-foreground/20 text-hero-foreground hover:bg-hero-foreground/10' : 'border-border bg-card text-foreground hover:bg-muted'}`}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
