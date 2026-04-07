'use client';

import { Mail, Phone, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Contact {
  id: string;
  nombre_completo: string;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
  es_principal: boolean;
}

interface EmpresaContactsProps {
  contactos: Contact[];
}

export function EmpresaContacts({ contactos }: EmpresaContactsProps) {
  if (contactos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aún no hay contactos.</p>
    );
  }

  return (
    <div className="grid gap-4">
      {contactos.map((c) => (
        <Card key={c.id} className="gap-3 py-5">
          <CardHeader className="px-5 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium break-words">
                {c.nombre_completo}
              </span>
              {c.es_principal && (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Star className="h-3 w-3" />
                  Principal
                </Badge>
              )}
            </div>
            {c.cargo && (
              <p className="text-xs text-muted-foreground">{c.cargo}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2 px-5 text-sm">
            {c.telefono && (
              <a
                href={`tel:${c.telefono}`}
                className="flex items-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 break-all">{c.telefono}</span>
              </a>
            )}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                className="flex items-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 break-all">{c.email}</span>
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
