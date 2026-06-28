import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-surface-border)] bg-[var(--color-surface)] p-5 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function SkeletonFila() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[var(--color-surface-border)]">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function SkeletonLista({ n = 5 }: { n?: number }) {
  return (
    <div>
      {Array.from({ length: n }).map((_, i) => <SkeletonFila key={i} />)}
    </div>
  );
}
