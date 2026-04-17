import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardNotFound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No encontrado</h2>
        <p className="text-sm text-muted-foreground">
          La página o el registro que buscas no existe.
        </p>
        <Link
          href="/pipeline"
          className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Volver al embudo
        </Link>
      </CardContent>
    </Card>
  );
}
