import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loadEnv } from 'vite';
import pg from 'pg';

const env = loadEnv('development', process.cwd(), '');
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: await fs.readFile(
      new URL('../certs/supabase-ca.crt', import.meta.url),
      'utf8',
    ),
  },
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
});
let transaction = false;
try {
  await client.connect();
  const employees = await client.query(
    "select count(*)::int as count from auth.users where raw_app_meta_data->>'role' = 'employee'",
  );
  console.log(`Configured employee accounts: ${employees.rows[0].count}.`);
  await client.query('BEGIN');
  transaction = true;
  const userId = randomUUID();
  // This temporary auth row and all bookings are rolled back, never committed.
  await client.query(
    "insert into auth.users (id, email, aud, role, raw_app_meta_data) values ($1,$2,'authenticated','authenticated',$3)",
    [userId, `verification-${userId}@example.invalid`, { role: 'employee' }],
  );
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({
      sub: userId,
      role: 'authenticated',
      app_metadata: { role: 'employee' },
    }),
  ]);
  await client.query('SET LOCAL ROLE authenticated');
  const payload = {
    customer: {
      customerType: 'consumer',
      title: 'Ms',
      firstName: 'Test',
      lastName: 'Customer',
      street: '24 Demo Lane',
      suburb: 'Napier South',
      city: 'Napier',
      postCode: '4110',
      phone: '+64 6 555 0142',
      email: 'customer@example.invalid',
    },
    repair: {
      purchaseDate: '2026-01-01',
      repairDate: '2099-01-02',
      repairTime: '13:30',
      imei: '123456789012345',
      make: 'Apple',
      model: 'Test',
      fault: 'Screen',
      description: 'Database verification only',
      warranty: false,
    },
    courtesy_items: [{ id: 1, type: 'phone', name: 'iphone 10', bond: 275 }],
    costs: {
      bond: 275,
      serviceFee: 85,
      total: 360,
      gst: 54,
      totalWithGst: 414,
    },
    business: {
      companyName: 'Phone Fix Napier (Demo)',
      phone: '+64 6 555 0142',
      email: 'repairs@phonefix.example',
      physicalAddress: '24 Demo Lane, Napier South, Napier 4110, New Zealand',
      businessCard: 'Sample business details only',
    },
  };
  const insert = async () =>
    client.query(
      'insert into public.bookings (id,customer,repair,courtesy_items,costs,business) values ($1,$2,$3,$4,$5,$6) returning id,job_number,created_at,created_by',
      [
        randomUUID(),
        payload.customer,
        payload.repair,
        JSON.stringify(payload.courtesy_items),
        payload.costs,
        payload.business,
      ],
    );
  const first = (await insert()).rows[0];
  const second = (await insert()).rows[0];
  assert.notEqual(first.job_number, second.job_number);
  assert.equal(first.created_by, userId);
  assert.ok(first.created_at instanceof Date);
  const saved = (
    await client.query(
      'select customer,repair,courtesy_items,costs,business from public.bookings where id=$1',
      [first.id],
    )
  ).rows[0];
  assert.deepEqual(saved, payload);
  console.log(
    'PASS: employee insert/retrieve, all submitted details, business snapshot, unique generated job numbers and server invoice timestamp.',
  );
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, role: 'authenticated', app_metadata: {} }),
  ]);
  assert.equal(
    (
      await client.query('select id from public.bookings where id=$1', [
        first.id,
      ])
    ).rowCount,
    0,
  );
  await client.query('SAVEPOINT denied_insert');
  let blocked = false;
  try {
    await insert();
  } catch (error) {
    blocked = error.code === '42501';
  }
  await client.query('ROLLBACK TO SAVEPOINT denied_insert');
  assert.ok(blocked, 'Ordinary user insertion must be blocked');
  await client.query('RESET ROLE');
  await client.query('SET LOCAL ROLE anon');
  await client.query('SAVEPOINT denied_select');
  blocked = false;
  try {
    await client.query('select id from public.bookings limit 0');
  } catch (error) {
    blocked = error.code === '42501';
  }
  await client.query('ROLLBACK TO SAVEPOINT denied_select');
  assert.ok(blocked, 'Public reads must be blocked');
  console.log(
    'PASS: non-employee writes/reads and anonymous access are blocked.',
  );
} catch (error) {
  console.log(`Database verification failed: ${error.code ?? error.name}.`);
  process.exitCode = 1;
} finally {
  if (transaction) {
    await client.query('ROLLBACK');
    console.log(
      'Test transaction rolled back; no test users or booking rows retained. Sequence numbers may have advanced.',
    );
  }
  await client.end();
}
