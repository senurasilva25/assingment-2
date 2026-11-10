import fs from 'node:fs/promises';
import { loadEnv } from 'vite';
import pg from 'pg';

// Database credentials stay in Node.js; only VITE_ public values enter React.
const env = loadEnv('development', process.cwd(), '');
const apply = process.argv.includes('--apply');
const expectedColumns = [
  'id',
  'job_number',
  'created_at',
  'created_by',
  'customer',
  'repair',
  'courtesy_items',
  'costs',
  'business',
];

async function checkRest() {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    console.log('Supabase REST: public URL or key missing.');
    return;
  }
  try {
    const response = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/bookings?select=id&limit=0`,
      {
        headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY },
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = await response.json();
    // Never log credentials, customer rows or complete server error objects.
    console.log(
      `Supabase REST: HTTP ${response.status}; code ${result.code ?? 'none'}.`,
    );
    if (result.code === '42501')
      console.log(
        'Public table access is denied, as expected for employee-only bookings.',
      );
    if (result.code === 'PGRST205')
      console.log('The bookings table is not present in the API schema cache.');
  } catch (error) {
    console.log(
      `Supabase REST connection failed: ${error.cause?.code ?? error.name}.`,
    );
    process.exitCode = 1;
  }
}

async function checkDatabase() {
  if (!env.DATABASE_URL) {
    console.log(
      'PostgreSQL: DATABASE_URL is missing; table creation requires database access.',
    );
    process.exitCode = 1;
    return;
  }
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
      ca: await fs.readFile(
        env.DATABASE_SSL_CA_PATH ||
          new URL('../certs/supabase-ca.crt', import.meta.url),
        'utf8',
      ),
    },
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
    application_name: 'phone-fix-schema-setup',
  });
  try {
    await client.connect();
    console.log('PostgreSQL: connected with verified TLS.');
    const exists = await client.query(
      "select to_regclass('public.bookings') as name",
    );
    if (!exists.rows[0].name && apply) {
      const sql = await fs.readFile(
        new URL('../supabase.sql', import.meta.url),
        'utf8',
      );
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(
          'Created public.bookings, employee policies, grants, and job-number sequence.',
        );
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } else if (!exists.rows[0].name) {
      console.log(
        'PostgreSQL: bookings table is missing. Run npm run db:setup to create it.',
      );
      return;
    } else {
      console.log(
        'PostgreSQL: bookings already exists; preserving the table and its records.',
      );
    }
    const columns = await client.query(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'bookings'",
    );
    const missing = expectedColumns.filter(
      (name) => !columns.rows.some((row) => row.column_name === name),
    );
    if (missing.length)
      throw Object.assign(new Error(), {
        code: `MISSING_COLUMNS:${missing.join(',')}`,
      });
    const security = await client.query(
      "select relrowsecurity from pg_class where oid = 'public.bookings'::regclass",
    );
    const policies = await client.query(
      "select policyname from pg_policies where schemaname = 'public' and tablename = 'bookings'",
    );
    console.log(
      `Schema verified: ${columns.rowCount} columns; RLS ${security.rows[0].relrowsecurity ? 'enabled' : 'DISABLED'}; ${policies.rowCount} policies.`,
    );
  } catch (error) {
    console.log(`PostgreSQL failed: ${error.code ?? error.name}.`);
    if (error.code === '28P01') {
      console.log(
        'Authentication rejected. Update DATABASE_URL with the project database password, URL-encoding special characters.',
      );
    }
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await checkDatabase();
await checkRest();
