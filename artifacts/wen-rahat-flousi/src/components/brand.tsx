import { Link } from 'wouter';
import { CreditCard } from 'lucide-react';

export function Brand({ tagline = 'اشتراكاتك، بمكان واحد' }: { tagline?: string }) {
  return (
    <Link href="/" data-testid="link-home" className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-[14px] bg-primary text-primary-foreground">
        <CreditCard size={19} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[17px] font-bold leading-tight">وين راحت فلوسي</p>
        <p className="mt-1 text-[11px] tracking-wide text-muted-foreground">{tagline}</p>
      </div>
    </Link>
  );
}
