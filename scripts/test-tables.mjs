import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/);
const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const client = createClient(url, key);

async function run() {
  const tables = ['monsters', 'spells', 'npcs', 'items', 'initiative_combatants', 'dm_notes'];
  for (const t of tables) {
    const { data, error } = await client.from(t).select('*').limit(1);
    if (error) {
      console.log(`[FAIL] Table ${t}: code=${error.code} message=${error.message}`);
    } else {
      console.log(`[OK] Table ${t}: rows=${data.length}`);
    }
  }
}
run();
