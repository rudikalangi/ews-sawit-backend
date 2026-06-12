import { Pool } from "pg";
import * as functions from "firebase-functions";

// For local testing vs deployed env
const connectionString = process.env.DATABASE_URL || functions.config().db?.url;

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Required for Neon DB
});

export const initDb = async () => {
  if (!connectionString) {
    functions.logger.warn("No DATABASE_URL found. PostgreSQL queries will fail.");
    return;
  }

  try {
    const client = await pool.connect();
    
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
        gps_path TEXT,
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
        bukti_foto TEXT,
        gps_latitude NUMERIC,
        gps_longitude NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    functions.logger.info("Database initialized successfully.");
  } catch (error) {
    functions.logger.error("Failed to initialize database", error);
  }
};
