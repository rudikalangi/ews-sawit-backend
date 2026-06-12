"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_service_1 = require("../services/db.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const storage_service_1 = require("../services/storage.service");
const router = (0, express_1.Router)();
// Apply auth middleware to all sync routes
router.use(auth_middleware_1.requireAuth);
// GET /api/sync/resources
router.get("/resources", async (req, res) => {
    try {
        const afdRows = await db_service_1.pool.query("SELECT * FROM afdelings ORDER BY id ASC");
        const blkRows = await db_service_1.pool.query("SELECT * FROM blocks ORDER BY name ASC");
        const afdelings = afdRows.rows.map((a) => ({
            id: a.id,
            name: a.name,
            totalBlocks: a.total_blocks,
            totalTrees: a.total_trees,
            centerLat: parseFloat(a.center_lat),
            centerLng: parseFloat(a.center_lng),
        }));
        const blocks = blkRows.rows.map((b) => ({
            id: b.id,
            afdelingId: b.afdeling_id,
            name: b.name,
            luasHa: parseFloat(b.luas_ha),
            totalTrees: b.total_trees,
        }));
        res.json({ afdelings, blocks });
    }
    catch (error) {
        console.error("Failed to fetch sync resources:", error);
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});
// POST /api/sync/upload
router.post("/upload", async (req, res) => {
    const { session, treeSurveys } = req.body;
    if (!session || !treeSurveys) {
        res.status(400).json({ error: "Data upload tidak lengkap!" });
        return;
    }
    try {
        console.log(`📥 Received survey upload for session ${session.id} (${treeSurveys.length} trees)`);
        // Ensure the uploader is the surveyor (or admin)
        if (req.user?.role !== "admin" && req.user?.nik !== session.surveyorNik) {
            res.status(403).json({ error: "Forbidden: Surveyor NIK mismatch" });
            return;
        }
        // Process Photos asynchronously
        const savedSelfieUrl = await (0, storage_service_1.handlePhotoStorage)(session.selfieUrl, "selfie");
        const uploadedTrees = await Promise.all(treeSurveys.map(async (t) => {
            const savedTreePhoto = await (0, storage_service_1.handlePhotoStorage)(t.buktiFoto, `tree_${t.rowNumber}_${t.treeNumber}`);
            return {
                ...t,
                buktiFoto: savedTreePhoto,
            };
        }));
        const client = await db_service_1.pool.connect();
        try {
            await client.query("BEGIN");
            // Delete existing to prevent duplicates on re-upload
            await client.query("DELETE FROM tree_surveys WHERE session_id = $1", [session.id]);
            await client.query("DELETE FROM survey_sessions WHERE id = $1", [session.id]);
            // Insert Session
            await client.query(`INSERT INTO survey_sessions (
          id, surveyor_nik, surveyor_name, afdeling_id, block_id, luas_ha, jumlah_pokok, tanggal, waktu_mulai, selfie_url, status, gps_path
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [
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
                "synced",
                JSON.stringify(session.gpsPath || []),
            ]);
            // Insert Trees
            for (const t of uploadedTrees) {
                await client.query(`INSERT INTO tree_surveys (
            id, session_id, row_number, tree_number, tikus, tirataba, ulat_api, ulat_kantung, bukti_foto, gps_latitude, gps_longitude
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
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
                    t.gpsLongitude,
                ]);
            }
            await client.query("COMMIT");
        }
        catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
        res.json({
            success: true,
            message: "Sinkronisasi survey berhasil diupload!",
            sessionId: session.id,
            savedSelfieUrl,
        });
    }
    catch (err) {
        console.error("Upload process failed:", err);
        res.status(500).json({ error: "Gagal mengupload rekap kerja hasil survey!" });
    }
});
exports.default = router;
//# sourceMappingURL=sync.routes.js.map