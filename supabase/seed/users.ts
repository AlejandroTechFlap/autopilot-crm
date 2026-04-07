import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserMap {
  admin: string;
  rebeca: string;
  ignacio: string;
  laura: string;
}

const USERS = [
  { key: 'admin' as const, email: 'admin@autopilotcrm.com', password: 'Admin123!', nombre: 'Administrador', rol: 'admin' },
  { key: 'rebeca' as const, email: 'rebeca@autopilotcrm.com', password: 'Rebeca123!', nombre: 'Rebeca Navarro', rol: 'direccion' },
  { key: 'ignacio' as const, email: 'ignacio@autopilotcrm.com', password: 'Ignacio123!', nombre: 'Ignacio Perez', rol: 'vendedor' },
  { key: 'laura' as const, email: 'laura@autopilotcrm.com', password: 'Laura123!', nombre: 'Laura Gomez', rol: 'vendedor' },
];

export async function seedUsers(supabase: SupabaseClient): Promise<UserMap> {
  console.log('  Creating auth users...');
  const userMap = {} as UserMap;

  for (const user of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { nombre: user.nombre },
    });

    if (error) {
      // User already exists — look up their ID
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === user.email);
      if (existing) {
        userMap[user.key] = existing.id;
        console.log(`    ${user.nombre} (existing: ${existing.id})`);
        continue;
      }
      throw new Error(`Failed to create user ${user.email}: ${error.message}`);
    }

    userMap[user.key] = data.user.id;
    console.log(`    ${user.nombre} (${data.user.id})`);
  }

  console.log('  Inserting usuarios records...');
  for (const user of USERS) {
    const { error } = await supabase.from('usuarios').upsert({
      id: userMap[user.key],
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
    if (error) throw new Error(`Failed to upsert usuario ${user.email}: ${error.message}`);
  }

  return userMap;
}
