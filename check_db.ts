import { db } from './src/db';
import { hamaPenyakit } from './src/db/schema';

db.select().from(hamaPenyakit).then(res => {
  console.log('hamaPenyakit count:', res.length);
  console.log('Sample hamaPenyakit:', res.slice(0, 5).map(b => b.id));
  process.exit(0);
}).catch(console.error);
