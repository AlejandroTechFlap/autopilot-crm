import { Skeleton } from '@/components/ui/skeleton';

export function KanbanSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, c) => (
        <div key={c} className="w-72 shrink-0 space-y-3">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, r) => (
            <Skeleton key={r} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
