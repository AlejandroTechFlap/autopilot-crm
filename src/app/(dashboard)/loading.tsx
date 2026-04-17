import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Default dashboard fallback. Renders a page-shaped skeleton (title +
 * card grid) so users never see a blank screen or a tiny spinner on slow
 * server components. Route-specific `loading.tsx` files override this.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Cargando">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Card>
        <CardContent className="space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
      <span className="sr-only">Cargando contenido…</span>
    </div>
  );
}
