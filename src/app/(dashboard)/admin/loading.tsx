import { TableSkeleton } from '@/components/ui/skeletons/table-skeleton';

export default function AdminLoading() {
  return <TableSkeleton rows={5} cols={3} />;
}
