'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Vendedor {
  id: string;
  nombre: string;
}

interface PipelineFiltersProps {
  vendedores: Vendedor[];
  selectedVendedor: string;
  onVendedorChange: (value: string) => void;
  minValue: string;
  maxValue: string;
  onMinValueChange: (value: string) => void;
  onMaxValueChange: (value: string) => void;
}

function handleChange(
  onChange: (value: string) => void
): (value: string | null) => void {
  return (value) => onChange(value ?? 'all');
}

export function PipelineFilters({
  vendedores,
  selectedVendedor,
  onVendedorChange,
  minValue,
  maxValue,
  onMinValueChange,
  onMaxValueChange,
}: PipelineFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={selectedVendedor} onValueChange={handleChange(onVendedorChange)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Todos los vendedores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los vendedores</SelectItem>
          {vendedores.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="Mín €"
          value={minValue}
          onChange={(e) => onMinValueChange(e.target.value)}
          className="h-9 w-24"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          placeholder="Máx €"
          value={maxValue}
          onChange={(e) => onMaxValueChange(e.target.value)}
          className="h-9 w-24"
        />
      </div>
    </div>
  );
}
