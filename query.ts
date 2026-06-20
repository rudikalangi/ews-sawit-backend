import { db } from './src/db/index';
import { inspeksi, fotoBukti } from './src/db/schema';
import { count } from 'drizzle-orm';

async function run() {
  console.log('Inspeksi count:');
  const i = await db.select({ count: count() }).from(inspeksi);
  console.log(i);
  console.log('Foto count:');
  const f = await db.select({ count: count() }).from(fotoBukti);
  console.log(f);
  process.exit(0);
}
run();
