import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('ews_sawit.db');

export const initDb = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS afdeling (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blok (
        id TEXT PRIMARY KEY NOT NULL,
        afdeling_id TEXT NOT NULL,
        name TEXT NOT NULL,
        total_pokok INTEGER NOT NULL,
        FOREIGN KEY (afdeling_id) REFERENCES afdeling (id)
      );

      CREATE TABLE IF NOT EXISTS survey_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        surveyor_nik TEXT NOT NULL,
        surveyor_name TEXT NOT NULL,
        afdeling_id TEXT NOT NULL,
        block_id TEXT NOT NULL,
        luas_ha REAL NOT NULL,
        jumlah_pokok INTEGER NOT NULL,
        tanggal TEXT NOT NULL,
        waktu_mulai TEXT NOT NULL,
        selfie_url TEXT,
        status TEXT DEFAULT 'pending',
        gps_path TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tree_surveys (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        row_number INTEGER NOT NULL,
        tree_number INTEGER NOT NULL,
        tikus INTEGER DEFAULT 0,
        tirataba INTEGER DEFAULT 0,
        ulat_api INTEGER DEFAULT 0,
        ulat_kantung INTEGER DEFAULT 0,
        bukti_foto TEXT,
        gps_latitude REAL,
        gps_longitude REAL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES survey_sessions (id)
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Types
export interface Afdeling {
  id: string;
  name: string;
}

export interface Blok {
  id: string;
  afdeling_id: string;
  name: string;
  total_pokok: number;
}

export interface SurveySession {
  id: string;
  surveyor_nik: string;
  surveyor_name: string;
  afdeling_id: string;
  block_id: string;
  luas_ha: number;
  jumlah_pokok: number;
  tanggal: string;
  waktu_mulai: string;
  selfie_url: string | null;
  status: 'pending' | 'synced';
  gps_path: string;
  created_at: string;
}

export interface TreeSurvey {
  id: string;
  session_id: string;
  row_number: number;
  tree_number: number;
  tikus: boolean;
  tirataba: boolean;
  ulat_api: boolean;
  ulat_kantung: boolean;
  bukti_foto: string | null;
  gps_latitude?: number;
  gps_longitude?: number;
  created_at: string;
}

// Queries
export const getPendingSessions = (): SurveySession[] => {
  return db.getAllSync('SELECT * FROM survey_sessions WHERE status = ?', ['pending']) as SurveySession[];
};

export const getTreeSurveysBySession = (sessionId: string): TreeSurvey[] => {
  const rows = db.getAllSync('SELECT * FROM tree_surveys WHERE session_id = ?', [sessionId]) as any[];
  return rows.map(r => ({
    ...r,
    tikus: Boolean(r.tikus),
    tirataba: Boolean(r.tirataba),
    ulat_api: Boolean(r.ulat_api),
    ulat_kantung: Boolean(r.ulat_kantung)
  }));
};

export const saveSurveySession = (session: SurveySession) => {
  db.runSync(
    'INSERT INTO survey_sessions (id, surveyor_nik, surveyor_name, afdeling_id, block_id, luas_ha, jumlah_pokok, tanggal, waktu_mulai, selfie_url, status, gps_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [session.id, session.surveyor_nik, session.surveyor_name, session.afdeling_id, session.block_id, session.luas_ha, session.jumlah_pokok, session.tanggal, session.waktu_mulai, session.selfie_url || null, session.status, session.gps_path, session.created_at]
  );
};

export const saveTreeSurvey = (tree: TreeSurvey) => {
  db.runSync(
    'INSERT INTO tree_surveys (id, session_id, row_number, tree_number, tikus, tirataba, ulat_api, ulat_kantung, bukti_foto, gps_latitude, gps_longitude, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [tree.id, tree.session_id, tree.row_number, tree.tree_number, tree.tikus ? 1 : 0, tree.tirataba ? 1 : 0, tree.ulat_api ? 1 : 0, tree.ulat_kantung ? 1 : 0, tree.bukti_foto || null, tree.gps_latitude || null, tree.gps_longitude || null, tree.created_at]
  );
};

export const markSessionSynced = (id: string) => {
  db.runSync('UPDATE survey_sessions SET status = ? WHERE id = ?', ['synced', id]);
};

export const getSurveysByStatus = (): { pending: number, synced: number } => {
  const pending = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM survey_sessions WHERE status = ?', ['pending']);
  const synced = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM survey_sessions WHERE status = ?', ['synced']);

  
  return {
    pending: pending?.count || 0,
    synced: synced?.count || 0
  };
};

export const insertMockAfdelingData = () => {
  // Check if data already exists to avoid duplicates
  const existing = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM afdeling');
  if (existing && existing.count > 0) return;

  try {
    db.runSync('INSERT INTO afdeling (id, name) VALUES (?, ?)', ['A', 'Afdeling A']);
    db.runSync('INSERT INTO afdeling (id, name) VALUES (?, ?)', ['B', 'Afdeling B']);
    
    db.runSync('INSERT INTO blok (id, afdeling_id, name, total_pokok) VALUES (?, ?, ?, ?)', ['31', 'A', 'Blok 31', 6071]);
    db.runSync('INSERT INTO blok (id, afdeling_id, name, total_pokok) VALUES (?, ?, ?, ?)', ['32', 'A', 'Blok 32', 5430]);
    db.runSync('INSERT INTO blok (id, afdeling_id, name, total_pokok) VALUES (?, ?, ?, ?)', ['12', 'B', 'Blok 12', 4900]);
    
    console.log('Mock structural data inserted.');
  } catch (err) {
    console.error('Failed to insert mock data', err);
  }
};
