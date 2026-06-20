import { db } from './src/db/index';
import { estates, afdelings, hamaPenyakit } from './src/db/schema';
import { count } from 'drizzle-orm';

async function run() {
  console.log('estates:', await db.select({ c: count() }).from(estates));
  console.log('afdelings:', await db.select({ c: count() }).from(afdelings));
  console.log('hama:', await db.select({ c: count() }).from(hamaPenyakit));
  process.exit(0);
}
run();
