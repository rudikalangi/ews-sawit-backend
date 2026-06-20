import { db } from './src/db/index';
import { bloks } from './src/db/schema';

async function run() {
  const b = await db.select().from(bloks);
  console.log(b);
  process.exit(0);
}
run();
