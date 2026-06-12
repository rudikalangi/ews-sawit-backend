import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase packet limit for photo base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Setup simple user uploads directory if not using S3/R2
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Global DB Connection Config
let pool: pg.Pool | null = null;
let useDatabaseFallback = true;

// In-Memory/Disk Fallback Store
interface LocalStore {
  users: any[];
  afdelings: any[];
  blocks: any[];
  surveySessions: any[];
  treeSurveys: any[];
}

const LOCAL_STORE_PATH = path.join(process.cwd(), 'database_fallback.json');

function loadFallbackStore(): LocalStore {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const data = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to read local database fallback:", e);
  }
  return {
    users: [
      { nik: "123456", name: "Budi Santoso", role: "surveyor", passwordHash: "admin123" },
      { nik: "789012", name: "Rian Hidayat", role: "surveyor", passwordHash: "admin123" },
      { nik: "9999", name: "Administrator", role: "admin", passwordHash: "admin123" }
    ],
    afdelings: [
      { id: "A", name: "Afdeling A", totalBlocks: 5, totalTrees: 690, centerLat: -1.258, centerLng: 101.425 },
      { id: "B", name: "Afdeling B", totalBlocks: 3, totalTrees: 475, centerLat: -1.265, centerLng: 101.442 },
      { id: "C", name: "Afdeling C", totalBlocks: 2, totalTrees: 260, centerLat: -1.250, centerLng: 101.412 }
    ],
    blocks: [
      // Afdeling A Blocks
      { id: "J15", afdelingId: "A", name: "J15", luasHa: 21.92, totalTrees: 150 },
      { id: "J16", afdelingId: "A", name: "J16", luasHa: 18.50, totalTrees: 120 },
      { id: "J17", afdelingId: "A", name: "J17", luasHa: 24.10, totalTrees: 160 },
      { id: "K12", afdelingId: "A", name: "K12", luasHa: 22.15, totalTrees: 140 },
      { id: "K13", afdelingId: "A", name: "K13", luasHa: 20.00, totalTrees: 120 },
      // Afdeling B Blocks
      { id: "L08", afdelingId: "B", name: "L08", luasHa: 25.30, totalTrees: 180 },
      { id: "L09", afdelingId: "B", name: "L09", luasHa: 19.80, totalTrees: 145 },
      { id: "L10", afdelingId: "B", name: "L10", luasHa: 21.00, totalTrees: 150 },
      // Afdeling C Blocks
      { id: "M01", afdelingId: "C", name: "M01", luasHa: 20.40, totalTrees: 135 },
      { id: "M02", afdelingId: "C", name: "M02", luasHa: 18.90, totalTrees: 125 }
    ],
    surveySessions: [],
    treeSurveys: []
  };
}

function saveFallbackStore(store: LocalStore) {
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error("Failed to save local database fallback:", e);
  }
}

let localStore = loadFallbackStore();

// Initialize PostgreSQL if DATABASE_URL exists
async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("⚠️ No DATABASE_URL found in environment. Using JSON-File Fallback (demo mode).");
    return;
  }

  try {
    console.log("🔌 Attempting to connect to PostgreSQL (Neon DB)...");
    pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false } // Required for Coral/Neon SQL databases
    });

    // Test query & migration
    const client = await pool.connect();
    console.log("✅ PostgreSQL Connection successful!");

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        nik VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'surveyor',
        password_hash VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS afdelings (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        total_blocks INTEGER DEFAULT 0,
        total_trees INTEGER DEFAULT 0,
        center_lat NUMERIC NOT NULL,
        center_lng NUMERIC NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id VARCHAR(20) PRIMARY KEY,
        afdeling_id VARCHAR(10) REFERENCES afdelings(id),
        name VARCHAR(50) NOT NULL,
        luas_ha NUMERIC NOT NULL,
        total_trees INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS survey_sessions (
        id VARCHAR(100) PRIMARY KEY,
        surveyor_nik VARCHAR(50) REFERENCES users(nik),
        surveyor_name VARCHAR(100) NOT NULL,
        afdeling_id VARCHAR(10) REFERENCES afdelings(id),
        block_id VARCHAR(20) REFERENCES blocks(id),
        luas_ha NUMERIC NOT NULL,
        jumlah_pokok INTEGER NOT NULL,
        tanggal VARCHAR(50) NOT NULL,
        waktu_mulai VARCHAR(50) NOT NULL,
        selfie_url TEXT,
        status VARCHAR(20) DEFAULT 'synced',
        gps_path TEXT, -- JSON string of coordinates
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tree_surveys (
        id VARCHAR(100) PRIMARY KEY,
        session_id VARCHAR(100) REFERENCES survey_sessions(id) ON DELETE CASCADE,
        row_number INTEGER NOT NULL,
        tree_number INTEGER NOT NULL,
        tikus BOOLEAN DEFAULT FALSE,
        tirataba BOOLEAN DEFAULT FALSE,
        ulat_api BOOLEAN DEFAULT FALSE,
        ulat_kantung BOOLEAN DEFAULT FALSE,
        bukti_foto TEXT, -- Base64 content or public url
        gps_latitude NUMERIC,
        gps_longitude NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Guard user seeding
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log("🌱 Seeding initial PostgreSQL data...");
      
      // Users
      for (const u of localStore.users) {
        await client.query(`
          INSERT INTO users (nik, name, role, password_hash)
          VALUES ($1, $2, $3, $4)
        `, [u.nik, u.name, u.role, u.passwordHash]);
      }

      // Afdelings
      for (const a of localStore.afdelings) {
        await client.query(`
          INSERT INTO afdelings (id, name, total_blocks, total_trees, center_lat, center_lng)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [a.id, a.name, a.totalBlocks, a.totalTrees, a.centerLat, a.centerLng]);
      }

      // Blocks
      for (const b of localStore.blocks) {
        await client.query(`
          INSERT INTO blocks (id, afdeling_id, name, luas_ha, total_trees)
          VALUES ($1, $2, $3, $4, $5)
        `, [b.id, b.afdelingId, b.name, b.luasHa, b.totalTrees]);
      }
      
      console.log("🌱 Database Seeding completed successfully!");
    }

    client.release();
    useDatabaseFallback = false;
    console.log("🚀 PostgreSQL Database fully initialized and operational.");
  } catch (err) {
    console.error("❌ PostgreSQL database initialization failed! Falling back to JSON-File database.", err);
    useDatabaseFallback = true;
  }
}

initDatabase();

// Helpers to handle DB queries regardless of configuration
async function executeQuery(text: string, params: any[] = []): Promise<any[]> {
  if (!useDatabaseFallback && pool) {
    try {
      const res = await pool.query(text, params);
      return res.rows;
    } catch (e) {
      console.error("Postgres Query execution error, falling back to local memory:", e);
    }
  }
  return [];
}

// Helper to save uploaded photos with automated Cloudflare R2 synchronization
function handlePhotoStorage(base64Data: string | undefined, suffix: string): string {
  if (!base64Data) return '';
  if (!base64Data.startsWith('data:image')) {
    return base64Data; // Already a URL or filename
  }

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Data; // Fallback
    }

    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = type.split('/')[1] || 'png';
    const filename = `${Date.now()}_${suffix}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Save locally first to be safe
    fs.writeFileSync(filePath, buffer);
    console.log(`💾 Saved file locally to ${filePath}`);

    // If R2 credentials are ready, upload to Cloudflare R2 in a non-blocking way
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const r2Endpoint = process.env.R2_ENDPOINT;

    if (accessKeyId && secretAccessKey && bucketName && r2Endpoint) {
      console.log(`☁️ Cloudflare R2 configured! Syncing ${filename} to R2 bucket "${bucketName}"...`);
      
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: r2Endpoint,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey
        }
      });

      s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: buffer,
        ContentType: type
      }))
      .then(() => {
        console.log(`✅ Successfully synced ${filename} to Cloudflare R2 bucket: "${bucketName}"!`);
      })
      .catch((r2Error: any) => {
        console.error(`❌ Cloudflare R2 Upload error for ${filename}:`, r2Error.message || r2Error);
      });
    } else {
      console.log("ℹ️ Cloudflare R2 is not fully configured. Using local fallback.");
    }
    
    // Return relative path accessed via web router
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("Error storing photo:", err);
    return base64Data; // Return direct string if storage fail
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Authentication
app.post('/api/auth/login', async (req, res) => {
  const { nik, password } = req.body;

  if (!nik || !password) {
    return res.status(400).json({ error: 'NIK dan Password harus diisi!' });
  }

  // Look up user
  let user: any = null;

  if (!useDatabaseFallback && pool) {
    try {
      const rows = await pool.query('SELECT * FROM users WHERE nik = $1', [nik]);
      if (rows.rows.length > 0) {
        const u = rows.rows[0];
        user = { nik: u.nik, name: u.name, role: u.role, passwordHash: u.password_hash };
      }
    } catch (e) {
      console.error("Postgres Auth failed:", e);
    }
  }

  // Fallback DB authentication
  if (!user) {
    user = localStore.users.find(u => u.nik === nik);
  }

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'NIK atau Password tidak terdaftar/salah!' });
  }

  res.json({
    success: true,
    token: "dummy-jwt-token-12345",
    user: {
      nik: user.nik,
      name: user.name,
      role: user.role
    },
    // Backwards compatibility for web emulator
    nik: user.nik,
    name: user.name,
    role: user.role
  });
});

// 2. Fetch Master Resources (Afdeling & Blocks) - "Unduhan Sumber Daya"
app.get('/api/sync/resources', async (req, res) => {
  let afdelings = localStore.afdelings;
  let blocks = localStore.blocks;

  if (!useDatabaseFallback && pool) {
    try {
      const afdRows = await pool.query('SELECT * FROM afdelings ORDER BY id ASC');
      const blkRows = await pool.query('SELECT * FROM blocks ORDER BY name ASC');
      if (afdRows.rows.length > 0) {
        afdelings = afdRows.rows.map(a => ({
          id: a.id,
          name: a.name,
          totalBlocks: a.total_blocks,
          totalTrees: a.total_trees,
          centerLat: parseFloat(a.center_lat),
          centerLng: parseFloat(a.center_lng)
        }));
      }
      if (blkRows.rows.length > 0) {
        blocks = blkRows.rows.map(b => ({
          id: b.id,
          afdelingId: b.afdeling_id,
          name: b.name,
          luasHa: parseFloat(b.luas_ha),
          totalTrees: b.total_trees
        }));
      }
    } catch (e) {
      console.error("Failed to query resources from PG:", e);
    }
  }

  res.json({ afdelings, blocks });
});

// 3. Upload Survey Recaps (LHM sync)
app.post('/api/sync/upload', async (req, res) => {
  const { session, treeSurveys } = req.body;

  if (!session || !treeSurveys) {
    return res.status(400).json({ error: 'Data upload tidak lengkap!' });
  }

  try {
    console.log(`📥 Received survey upload for session ${session.id} (${treeSurveys.length} trees)`);

    // Store photos (either to R2 or safe locally)
    const savedSelfieUrl = handlePhotoStorage(session.selfieUrl, 'selfie_session');

    const uploadedTrees = treeSurveys.map((t: any) => {
      const savedTreePhoto = handlePhotoStorage(t.buktiFoto, `tree_${t.rowNumber}_${t.treeNumber}`);
      return {
        ...t,
        buktiFoto: savedTreePhoto
      };
    });

    if (!useDatabaseFallback && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Delete existing session and tree surveys if they exist (to prevent duplicates on re-upload)
        await client.query('DELETE FROM tree_surveys WHERE session_id = $1', [session.id]);
        await client.query('DELETE FROM survey_sessions WHERE id = $1', [session.id]);

        // Insert Session
        await client.query(`
          INSERT INTO survey_sessions (
            id, surveyor_nik, surveyor_name, afdeling_id, block_id, luas_ha, jumlah_pokok, tanggal, waktu_mulai, selfie_url, status, gps_path
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          session.id,
          session.surveyorNik,
          session.surveyorName,
          session.afdelingId,
          session.blockId,
          session.luasHa,
          session.jumlahPokok,
          session.tanggal,
          session.waktuMulai,
          savedSelfieUrl,
          'synced',
          JSON.stringify(session.gpsPath || [])
        ]);

        // Insert Trees
        for (const t of uploadedTrees) {
          await client.query(`
            INSERT INTO tree_surveys (
              id, session_id, row_number, tree_number, tikus, tirataba, ulat_api, ulat_kantung, bukti_foto, gps_latitude, gps_longitude
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            t.id,
            session.id,
            t.rowNumber,
            t.treeNumber,
            t.tikus,
            t.tirataba,
            t.ulatApi,
            t.ulatKantung,
            t.buktiFoto,
            t.gpsLatitude,
            t.gpsLongitude
          ]);
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    // Always update the fallback memory/file database so we have full sync tracking visible
    localStore.surveySessions = localStore.surveySessions.filter(s => s.id !== session.id);
    localStore.surveySessions.push({
      ...session,
      selfieUrl: savedSelfieUrl,
      status: 'synced',
      createdAt: new Date().toISOString()
    });

    const sessionTreeIds = uploadedTrees.map((t: any) => t.id);
    localStore.treeSurveys = localStore.treeSurveys.filter(t => !sessionTreeIds.includes(t.id) && t.sessionId !== session.id);
    localStore.treeSurveys.push(...uploadedTrees.map((t: any) => ({
      ...t,
      createdAt: new Date().toISOString()
    })));

    saveFallbackStore(localStore);

    res.json({
      success: true,
      message: 'Sinkronisasi survey berhasil diupload!',
      sessionId: session.id,
      savedSelfieUrl
    });

  } catch (err) {
    console.error("Upload process failed:", err);
    res.status(500).json({ error: 'Gagal mengupload rekap kerja hasil survey!' });
  }
});

// 4. Admin Dashboard Metrics (Retrieve aggregated survey data)
app.get('/api/admin/dashboard', async (req, res) => {
  let sessions = localStore.surveySessions;
  let trees = localStore.treeSurveys;

  if (!useDatabaseFallback && pool) {
    try {
      const sessRows = await pool.query('SELECT * FROM survey_sessions ORDER BY created_at DESC');
      const treeRows = await pool.query('SELECT * FROM tree_surveys ORDER BY created_at DESC');
      
      sessions = sessRows.rows.map(s => ({
        id: s.id,
        surveyorNik: s.surveyor_nik,
        surveyorName: s.surveyor_name,
        afdelingId: s.afdeling_id,
        blockId: s.block_id,
        luasHa: parseFloat(s.luas_ha),
        jumlahPokok: s.jumlah_pokok,
        tanggal: s.tanggal,
        waktuMulai: s.waktu_mulai,
        selfieUrl: s.selfie_url,
        status: s.status,
        gpsPath: s.gps_path ? JSON.parse(s.gps_path) : [],
        createdAt: s.created_at
      }));

      trees = treeRows.rows.map(t => ({
        id: t.id,
        sessionId: t.session_id,
        rowNumber: t.row_number,
        treeNumber: t.tree_number,
        tikus: t.tikus,
        tirataba: t.tirataba,
        ulatApi: t.ulat_api,
        ulatKantung: t.ulat_kantung,
        buktiFoto: t.bukti_foto,
        gpsLatitude: t.gps_latitude ? parseFloat(t.gps_latitude) : undefined,
        gpsLongitude: t.gps_longitude ? parseFloat(t.gps_longitude) : undefined,
        createdAt: t.created_at
      }));
    } catch (e) {
      console.error("Failed to query dashboard metrics from PG:", e);
    }
  }

  // Calculate Aggregates
  const totalSurveys = sessions.length;
  
  const blockIds = new Set(sessions.map(s => s.blockId));
  const totalBlocksSurveyed = blockIds.size;
  const totalTreesSurveyed = trees.length;

  let tikusCount = 0;
  let tiratabaCount = 0;
  let ulatApiCount = 0;
  let ulatKantungCount = 0;

  trees.forEach(t => {
    if (t.tikus) tikusCount++;
    if (t.tirataba) tiratabaCount++;
    if (t.ulatApi) ulatApiCount++;
    if (t.ulatKantung) ulatKantungCount++;
  });

  // Calculate daily trend
  const trendMap: Record<string, { tikus: number; tirataba: number; ulatApi: number; ulatKantung: number }> = {};
  
  trees.forEach(t => {
    let dateStr = new Date(t.createdAt).toLocaleDateString();
    if (!trendMap[dateStr]) {
      trendMap[dateStr] = { tikus: 0, tirataba: 0, ulatApi: 0, ulatKantung: 0 };
    }
    if (t.tikus) trendMap[dateStr].tikus++;
    if (t.tirataba) trendMap[dateStr].tirataba++;
    if (t.ulatApi) trendMap[dateStr].ulatApi++;
    if (t.ulatKantung) trendMap[dateStr].ulatKantung++;
  });

  const attackTrend = Object.keys(trendMap).slice(-7).map(date => ({
    date,
    ...trendMap[date]
  }));

  // Fallback to demo trend if no survey done yet
  if (attackTrend.length === 0) {
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      attackTrend.push({
        date: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        tikus: Math.floor(Math.random() * 5),
        tirataba: Math.floor(Math.random() * 8),
        ulatApi: Math.floor(Math.random() * 4),
        ulatKantung: Math.floor(Math.random() * 6)
      });
    }
  }

  // Recent Survey list
  const recentSurveys = sessions.slice(0, 10).map(s => {
    const sessionTrees = trees.filter(t => t.sessionId === s.id);
    const damageCount = sessionTrees.filter(t => t.tikus || t.tirataba || t.ulatApi || t.ulatKantung).length;
    return {
      id: s.id,
      surveyorName: s.surveyorName,
      afdelingName: "Afdeling " + s.afdelingId,
      blockName: s.blockId,
      tanggal: s.tanggal,
      damageCount,
      hasSelfie: !!s.selfieUrl
    };
  });

  // Tree Markers for Leaflet GPS Map in the admin portal
  const treeMarkers = trees.map(t => {
    const s = sessions.find(sess => sess.id === t.sessionId);
    // Fabricate a coordinate offset from Afdeling center if GPS coordinate was missing
    let lat = t.gpsLatitude;
    let lng = t.gpsLongitude;

    if (!lat || !lng) {
      const afd = localStore.afdelings.find(a => a.id === (s?.afdelingId || 'A'));
      const centerLat = afd ? afd.centerLat : -1.258;
      const centerLng = afd ? afd.centerLng : 101.425;
      
      // Seed slightly around center based on row/tree numbers for visualization
      lat = centerLat + (t.rowNumber * 0.0003) - (t.treeNumber * 0.0001);
      lng = centerLng + (t.treeNumber * 0.0003) + (t.rowNumber * 0.0001);
    }

    const damageSummary: string[] = [];
    if (t.tikus) damageSummary.push('TK (Tikus)');
    if (t.tirataba) damageSummary.push('TR (Tirataba)');
    if (t.ulatApi) damageSummary.push('UA (Ulat Api)');
    if (t.ulatKantung) damageSummary.push('UK (Ulat Kantung)');

    return {
      id: t.id,
      afdelingId: s?.afdelingId || 'A',
      blockId: s?.blockId || 'J15',
      rowNumber: t.rowNumber,
      treeNumber: t.treeNumber,
      lat,
      lng,
      hasDamage: damageSummary.length > 0,
      damageSummary,
      buktiFoto: t.buktiFoto
    };
  });

  res.json({
    totalSurveys,
    totalBlocksSurveyed,
    totalTreesSurveyed,
    attackCounts: {
      tikus: tikusCount,
      tirataba: tiratabaCount,
      ulatApi: ulatApiCount,
      ulatKantung: ulatKantungCount
    },
    attackTrend,
    recentSurveys,
    treeMarkers
  });
});

// Serve local upload static photos
app.use('/uploads', express.static(UPLOADS_DIR));

// ----------------------------------------------------
// VITE CLIENT ROUTING & SERVER START
// ----------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 EWS Sawit Backend running at http://0.0.0.0:${PORT}`);
    console.log(`📁 Uploads available at /uploads/`);
  });
}

bootstrap();
