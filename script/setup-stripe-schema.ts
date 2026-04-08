import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const client = await pool.connect();

  try {
    console.log('Creating stripe schema...');
    await client.query('CREATE SCHEMA IF NOT EXISTS stripe;');

    console.log('Creating migrations tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS stripe.migrations (
        id serial PRIMARY KEY,
        name text NOT NULL UNIQUE,
        applied_at timestamptz DEFAULT now()
      );
    `);

    const migrationsDir = path.join(
      process.cwd(),
      'node_modules/stripe-replit-sync/dist/migrations'
    );

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM stripe.migrations WHERE name = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`  Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`  Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO stripe.migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [file]
        );
        console.log(`    Done.`);
      } catch (err: any) {
        console.error(`    Failed: ${err.message}`);
        throw err;
      }
    }

    console.log('All Stripe migrations applied successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
