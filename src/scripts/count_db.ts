import { db } from '../db';
import { pokok, baris } from '../db/schema';
import { sql } from 'drizzle-orm';

async function run() {
  const barisCount = await db.select({ count: sql<number>`count(*)` }).from(baris);
  const pokokCount = await db.select({ count: sql<number>`count(*)` }).from(pokok);
  
  console.log('Baris Count:', barisCount[0].count);
  console.log('Pokok Count:', pokokCount[0].count);
  
  process.exit(0);
}

run().catch(console.error);
