import { db } from '../db';
import { companies, estates, afdelings, bloks } from '../db/schema';
import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'drizzle-orm';

const GEOJSON_PATH = path.resolve(__dirname, '../../../BATAS_BLOCK_GEOJSON/BATAS_BLOCK_GEOJSON.geojson');
const AFDELING_GEOJSON_PATH = path.resolve(__dirname, '../../../BATAS_AFDELING_&_BLOCK/batas_afdeling.geojson');

async function seed() {
  console.log('Starting GIS seed process...');

  // 1. Create Company
  const [company] = await db.insert(companies).values({
    name: 'PT Dwiwira Lestari Jaya',
    code: 'DLJ'
  }).returning();
  
  console.log(`Created Company: ${company.name}`);

  // 2. Mapping WERKS to Estate
  // From our analysis:
  // 5421 -> Estate INTI (A-G) -> DLJ 1
  // 5431 -> PLASMA Kop. Sawit Sejahtera
  // 5432 -> PLASMA Kop. Biatan Bersama
  // 5433 -> PLASMA Kop. Biatan Sejahtera
  
  const estateMap: Record<string, string> = {};
  
  const insertEstate = async (name: string, code: string) => {
    const [estate] = await db.insert(estates).values({
      companyId: company.id,
      name,
      code,
    }).returning();
    estateMap[code] = estate.id;
    return estate;
  };

  await insertEstate('Estate INTI DLJ 1', '5421');
  await insertEstate('PLASMA Kop. Sawit Sejahtera', '5431');
  await insertEstate('PLASMA Kop. Biatan Bersama', '5432');
  await insertEstate('PLASMA Kop. Biatan Sejahtera', '5433');
  
  console.log('Created Estates.');

  // 3. Process Afdelings (from batas_afdeling.geojson)
  // Need to handle duplicates for C (5421C) and F (5421F)
  const afdRaw = fs.readFileSync(AFDELING_GEOJSON_PATH, 'utf-8');
  const afdData = JSON.parse(afdRaw);
  
  const afdelingMap: Record<string, string> = {};
  
  // Deduplicate and aggregate geometry logic using PostGIS would be complex directly through ORM inserts
  // Instead, we can group them by AFD_CODE and ST_Union their geometries.
  
  // We'll insert them one by one. If it already exists in our map, we run an update with ST_Union.
  console.log(`Processing ${afdData.features.length} Afdeling features...`);
  
  for (const feature of afdData.features) {
    const props = feature.properties;
    const afdCode = props.AFD_CODE;
    const werks = props.WERKS;
    const estateId = estateMap[werks];
    
    if (!estateId) {
      console.warn(`Estate not found for WERKS: ${werks}`);
      continue;
    }
    
    const geomJson = JSON.stringify(feature.geometry);

    if (afdelingMap[afdCode]) {
      // Duplicate found (C or F), ST_Union the geometry
      const existingAfdId = afdelingMap[afdCode];
      await db.execute(sql`
        UPDATE afdelings 
        SET boundary_polygon = ST_Multi(ST_Union(boundary_polygon, ST_GeomFromGeoJSON(${geomJson})))
        WHERE id = ${existingAfdId}
      `);
      console.log(`Updated Afdeling (ST_Union) for ${afdCode}`);
    } else {
      // New Afdeling
      const [afd] = await db.insert(afdelings).values({
        estateId,
        name: props.AFD,
        code: afdCode,
        tipe: props.KEBUN,
        rayon: props.RAYON?.toString(),
        luasHa: props.LUAS || props.HA,
        // Drizzle allows passing SQL fragments for geometry
        boundaryPolygon: sql`ST_Multi(ST_GeomFromGeoJSON(${geomJson}))` as any
      }).returning();
      
      afdelingMap[afdCode] = afd.id;
      console.log(`Inserted Afdeling: ${afd.name} (${afdCode})`);
    }
  }

  // 4. Process Blocks
  const blkRaw = fs.readFileSync(GEOJSON_PATH, 'utf-8');
  const blkData = JSON.parse(blkRaw);
  
  console.log(`Processing ${blkData.features.length} Blok features...`);
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
    
    await db.insert(bloks).values({
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
    });
    
    countBlok++;
  }
  
  console.log(`Successfully inserted ${countBlok} blocks.`);
  console.log('Seed completed successfully!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
