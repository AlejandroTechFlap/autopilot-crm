import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const user = await requireAuth();

  // Role-based landing page
  switch (user.rol) {
    case 'admin':
    case 'direccion':
      redirect('/dashboard');
    case 'vendedor':
      redirect('/mis-tareas');
  }
}
