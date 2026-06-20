import { db } from './src/db/index';
import { pokok, baris } from './src/db/schema';
import { count } from 'drizzle-orm';

async function run() {
  const p = await db.select({ count: count() }).from(pokok);
  console.log('Pokok:', p);
  const b = await db.select({ count: count() }).from(baris);
  console.log('Baris:', b);
  process.exit(0);
}
run();
