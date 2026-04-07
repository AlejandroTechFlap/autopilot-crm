import { TableSkeleton } from '@/components/ui/skeletons/table-skeleton';

export default function ContactosLoading() {
  return <TableSkeleton rows={8} cols={5} />;
}
