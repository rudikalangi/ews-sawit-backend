import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigrations() {
  console.log('Connecting to database...');
  if (!process.env.DATABASE_URL) {
    console.error('CRITICAL ERROR: DATABASE_URL environment variable is missing!');
    console.error('Please set DATABASE_URL in your Render Environment settings.');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.DATABASE_URL?.includes('ssl=true')
      ? { rejectUnauthorized: false }
      : undefined
  });
  
  try {
    const db = drizzle(pool);
    
    console.log('Resolved migrations folder:', path.resolve(__dirname, '../../drizzle'));
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration error occurred details:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

runMigrations().catch(async (err) => {
  console.error('Migration failed:', err);
  // Wait for logs to flush
  await new Promise(res => setTimeout(res, 1000));
  process.exit(1);
});
