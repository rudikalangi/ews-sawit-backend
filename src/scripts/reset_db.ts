import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function resetDb() {
  console.log('Using DB:', process.env.DATABASE_URL);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected. Dropping schema public...');
    
    // Drop extension properly
    await client.query('DROP EXTENSION IF EXISTS postgis CASCADE;');
    
    // Drop all tables
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    
    console.log('Enabling PostGIS...');
    await client.query('CREATE EXTENSION postgis;');
    console.log('Database reset complete.');
    
  } catch (err) {
    console.error('Error resetting DB:', err);
  } finally {
    await client.end();
  }
}

resetDb();
