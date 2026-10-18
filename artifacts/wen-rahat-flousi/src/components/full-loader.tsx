export function FullLoader({ label = 'جاري التحميل' }: { label?: string }) {
  return (
    <div dir="rtl" className="grid min-h-[100dvh] place-items-center px-6" role="status" aria-label={label} data-testid="status-auth-loading">
      <div className="w-full max-w-[420px] animate-pulse space-y-4">
        <div className="mx-auto size-12 rounded-[16px] bg-muted" />
        <div className="mx-auto h-3 w-40 rounded bg-muted" />
        <div className="mx-auto h-2.5 w-28 rounded bg-muted/70" />
      </div>
    </div>
  );
}
