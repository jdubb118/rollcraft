// Run a SQL statement against the project via the Management API.
// Usage: node scripts/run-sql.mjs "select count(*) from gyms"
// Token comes from the Supabase CLI's keychain entry (same as setup-gym-schema).
import { execSync } from 'child_process';

const REF = 'hizlmlftwwkxdnljgqju';
const sql = process.argv[2];
if (!sql) { console.error('usage: run-sql.mjs "<sql>"'); process.exit(1); }

function getToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
  for (const svc of ['Supabase CLI', 'supabase', 'Supabase']) {
    try {
      const t = execSync(`security find-generic-password -s "${svc}" -w`, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000 }).toString().trim();
      if (t) return t;
    } catch { /* next */ }
  }
  throw new Error('no supabase token — run `supabase login`');
}

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
});
console.log(res.status, (await res.text()).slice(0, 1000));
