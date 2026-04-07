'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Rol = 'admin' | 'direccion' | 'vendedor';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  avatar_url: string | null;
  created_at: string;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

export function UsuarioTable() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/usuarios');
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as { usuarios: Usuario[] };
      setUsuarios(body.usuarios ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se han podido cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando usuarios...
      </div>
    );
  }

  if (usuarios.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No se han encontrado usuarios.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[180px]">Rol</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <UsuarioRow key={u.id} usuario={u} onSaved={load} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface UsuarioRowProps {
  usuario: Usuario;
  onSaved: () => Promise<void> | void;
}

function UsuarioRow({ usuario, onSaved }: UsuarioRowProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [rol, setRol] = useState<Rol>(usuario.rol);
  const [busy, setBusy] = useState(false);

  const dirty = nombre !== usuario.nombre || rol !== usuario.rol;

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, rol }),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Usuario guardado');
      await onSaved();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se ha podido guardar el usuario');
    } finally {
      setBusy(false);
    }
  }, [usuario.id, nombre, rol, onSaved, router]);

  return (
    <TableRow>
      <TableCell>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {usuario.email}
      </TableCell>
      <TableCell>
        <Select value={rol} onValueChange={(v) => setRol(v as Rol)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="direccion">Dirección</SelectItem>
            <SelectItem value="vendedor">Vendedor</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" onClick={save} disabled={!dirty || busy}>
          {busy ? 'Guardando...' : 'Guardar'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
