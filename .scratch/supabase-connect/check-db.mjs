import { DB_URL } from './conn.mjs';
import pg from 'pg';

const conn = DB_URL;

const client = new pg.Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  await client.connect();
  const v = await client.query('select version() as v');
  console.log('CONECTADO OK ->', v.rows[0].v.split(',').slice(0, 2).join(','));

  const me = await client.query('select current_user as u, current_database() as d, inet_server_addr()::text as ip');
  console.log('rol:', me.rows[0].u, '| db:', me.rows[0].d, '| host:', me.rows[0].ip);

  const tables = await client.query(`
    select c.relname as tabla,
           c.relrowsecurity as rls,
           (select count(*) from information_schema.columns k
             where k.table_schema='public' and k.table_name=c.relname) as columnas
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r'
    order by c.relname`);
  console.log('\ntablas en public:', tables.rowCount);
  for (const r of tables.rows) console.log(`  - ${r.tabla.padEnd(24)} rls=${r.rls ? 'ON' : 'off'} cols=${r.columnas}`);

  const counts = await client.query(`
    select 'campaigns' t, count(*)::int n from public.campaigns
    union all select 'monsters', count(*)::int from public.monsters
    union all select 'spells', count(*)::int from public.spells
    union all select 'npcs', count(*)::int from public.npcs
    union all select 'items', count(*)::int from public.items
    union all select 'encounters', count(*)::int from public.encounters
    union all select 'initiative_combatants', count(*)::int from public.initiative_combatants
    union all select 'dm_notes', count(*)::int from public.dm_notes`);
  console.log('\nfilas:');
  for (const r of counts.rows) console.log(`  - ${r.t.padEnd(22)} ${r.n}`);

  const pol = await client.query(`
    select tablename, count(*)::int n from pg_policies where schemaname='public'
    group by tablename order by tablename`);
  console.log('\npolicies RLS en public:', pol.rows.reduce((a, r) => a + r.n, 0));
  for (const r of pol.rows) console.log(`  - ${r.tablename.padEnd(24)} ${r.n} policies`);

  const funcs = await client.query(`
    select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' order by proname`);
  console.log('\nfunciones public:', funcs.rows.map(r => r.proname).join(', ') || '(ninguna)');

  const trigs = await client.query(`
    select tgname, tgrelid::regclass::text as tabla from pg_trigger where NOT tgisinternal order by tgrelid::regclass::text`);
  console.log('\ntriggers:', trigs.rows.map(r => `${r.tabla}.${r.tgname}`).join(', ') || '(ninguno)');

  const buckets = await client.query(`select id, public, file_size_limit from storage.buckets`).catch(e => ({ rows: [], err: e.message }));
  const bucketList = buckets.rows.map(r => `${r.id}(public=${r.public},limit=${r.file_size_limit})`).join(', ');
  console.log('\nbuckets storage:', buckets.err ?? (bucketList || '(ninguno)'));

  const users = await client.query('select count(*)::int n from auth.users');
  console.log('usuarios auth.users:', users.rows[0].n);

  const grants = await client.query(`
    select grantee, string_agg(DISTINCT privilege_type, ',') perms
    from information_schema.role_table_grants
    where table_schema='public' and grantee in ('anon','authenticated','service_role')
    group by grantee order by grantee`);
  console.log('\ngrants por rol:');
  for (const r of grants.rows) console.log(`  - ${r.grantee.padEnd(14)} ${r.perms}`);
} catch (e) {
  console.error('FALLO:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
