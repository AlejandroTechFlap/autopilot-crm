'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatting';
import type { VendedorStats } from '../types';

interface VendedorTableProps {
  data: VendedorStats[];
}

export function VendedorTable({ data }: VendedorTableProps) {
  if (data.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendedor</TableHead>
          <TableHead className="text-right">Oportunidades abiertas</TableHead>
          <TableHead className="text-right">Valor del pipeline</TableHead>
          <TableHead className="text-right">Ganadas</TableHead>
          <TableHead className="text-right">Actividades</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((v) => (
          <TableRow key={v.vendedor.id}>
            <TableCell className="font-medium">{v.vendedor.nombre}</TableCell>
            <TableCell className="text-right">{v.deals_abiertos}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(v.valor_pipeline)}
            </TableCell>
            <TableCell className="text-right">{v.deals_ganados}</TableCell>
            <TableCell className="text-right">{v.actividades}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
