import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function fixDb() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    // Try to create a new database
    console.log('Creating new database ews_db...');
    await client.query('CREATE DATABASE ews_db;');
    console.log('Database ews_db created.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixDb();
