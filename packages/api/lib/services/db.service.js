"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.pool = void 0;
const pg_1 = require("pg");
const functions = __importStar(require("firebase-functions"));
// For local testing vs deployed env
const connectionString = process.env.DATABASE_URL || functions.config().db?.url;
exports.pool = new pg_1.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Required for Neon DB
});
const initDb = async () => {
    if (!connectionString) {
        functions.logger.warn("No DATABASE_URL found. PostgreSQL queries will fail.");
        return;
    }
    try {
        const client = await exports.pool.connect();
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
    }
    catch (error) {
        functions.logger.error("Failed to initialize database", error);
    }
};
exports.initDb = initDb;
//# sourceMappingURL=db.service.js.map