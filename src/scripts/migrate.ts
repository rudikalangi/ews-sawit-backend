import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  const db = drizzle(pool);
  
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  console.log('Migrations complete.');
  
  await pool.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
