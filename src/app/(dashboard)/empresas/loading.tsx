import { TableSkeleton } from '@/components/ui/skeletons/table-skeleton';

export default function EmpresasLoading() {
  return <TableSkeleton rows={8} cols={6} />;
}
