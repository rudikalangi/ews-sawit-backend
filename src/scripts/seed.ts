import { db } from '../db';
import { companies, estates, afdelings, bloks } from '../db/schema';
import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'drizzle-orm';

const GEOJSON_PATH = path.resolve(__dirname, '../../../BATAS_BLOCK_GEOJSON/BATAS_BLOCK_GEOJSON.geojson');

async function seed() {
  console.log('Starting GIS seed process...');

  // 1. Create Company
  await db.insert(companies).values({
    id: '1',
    name: 'PT Dwiwira Lestari Jaya',
    code: 'DLJ'
  }).onConflictDoNothing();
  const company = (await db.select().from(companies).limit(1))[0];
  console.log(`Created/Fetched Company: ${company.name}`);

  // 2. Mapping WERKS to Estate
  const estateMap: Record<string, string> = {};
  
  const insertEstate = async (name: string, code: string) => {
    await db.insert(estates).values({
      id: code,
      companyId: company.id,
      name,
      code,
    }).onConflictDoNothing();
    estateMap[code] = code;
  };

  await insertEstate('Estate INTI DLJ 1', '5421');
  await insertEstate('PLASMA Kop. Sawit Sejahtera', '5431');
  await insertEstate('PLASMA Kop. Biatan Bersama', '5432');
  await insertEstate('PLASMA Kop. Biatan Sejahtera', '5433');
  
  console.log('Created Estates.');

  const blkRaw = fs.readFileSync(GEOJSON_PATH, 'utf-8');
  const blkData = JSON.parse(blkRaw);
  
  const afdelingMap: Record<string, string> = {};
  
  console.log(`Processing ${blkData.features.length} features for Afdelings and Bloks...`);
  
  for (const feature of blkData.features) {
    const props = feature.properties;
    const afdCode = props.AFD_CODE;
    const werks = props.WERKS;
    const estateId = estateMap[werks];
    
    if (!estateId) {
      continue;
    }

    if (!afdelingMap[afdCode]) {
      // New Afdeling
      await db.insert(afdelings).values({
        id: afdCode,
        estateId,
        name: props.AFD || afdCode,
        code: afdCode,
        tipe: props.KEBUN,
        rayon: props.RAYON?.toString(),
        luasHa: props.LUAS || props.HA,
        // Optional geometry for afdeling
      }).onConflictDoNothing();
      
      afdelingMap[afdCode] = afdCode;
      console.log(`Inserted/Fetched Afdeling: ${props.AFD || afdCode} (${afdCode})`);
    }
  }

  // 4. Process Blocks
  let countBlok = 0;
  
  for (const feature of blkData.features) {
    const props = feature.properties;
    const afdCode = props.AFD_CODE;
    const afdId = afdelingMap[afdCode];
    
    if (!afdId) {
      console.warn(`Afdeling not found for AFD_CODE: ${afdCode}`);
      continue;
    }
    
    const geomJson = JSON.stringify(feature.geometry);
    
    const joinId = props.JOIN || '';
    const blokId = joinId.length > 0 ? joinId : `${afdCode}_${props.BLOCK_NAME || ''}`;

    await db.insert(bloks).values({
      id: blokId,
      afdelingId: afdId,
      name: props.BLOCK_NAME,
      code: props.BLOCK_CODE?.toString(),
      tahunTanam: props.THN_TNM ? parseInt(props.THN_TNM) : null,
      varietas: props.PROGENY,
      topografi: props.TOPOGRAPHY,
      maturity: props.MATURITY,
      sph: props.SPH,
      luasHa: props.HA,
      totalPokokGis: props.POKOK,
      boundaryPolygon: sql`ST_Multi(ST_GeomFromGeoJSON(${geomJson}))` as any
    }).onConflictDoNothing();
    
    countBlok++;
  }
  
  console.log(`Successfully inserted ${countBlok} blocks.`);
  console.log('Seed completed successfully!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
