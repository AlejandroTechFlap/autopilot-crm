import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { seedUsers } from './seed/users';
import { seedPipeline } from './seed/pipeline';
import { seedCompanies } from './seed/companies';
import { seedContacts } from './seed/contacts';
import { seedDeals } from './seed/deals';
import { seedActivities } from './seed/activities';
import { seedConfig } from './seed/config';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Seeding Autopilot CRM...\n');

  const users = await seedUsers(supabase);
  await seedPipeline(supabase, users);
  await seedCompanies(supabase, users);
  await seedContacts(supabase);
  await seedDeals(supabase, users);
  await seedActivities(supabase, users);
  await seedConfig(supabase, users);

  console.log('\nSeed complete!');
  console.log('Users created:');
  console.log(`  admin:   ${users.admin} (admin@autopilotcrm.com / Admin123!)`);
  console.log(`  rebeca:  ${users.rebeca} (rebeca@autopilotcrm.com / Rebeca123!)`);
  console.log(`  ignacio: ${users.ignacio} (ignacio@autopilotcrm.com / Ignacio123!)`);
  console.log(`  laura:   ${users.laura} (laura@autopilotcrm.com / Laura123!)`);
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
