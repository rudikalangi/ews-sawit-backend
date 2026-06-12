"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_service_1 = require("../services/db.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Require valid token AND admin role for all admin routes
router.use(auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin);
// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
    try {
        const sessRows = await db_service_1.pool.query("SELECT * FROM survey_sessions ORDER BY created_at DESC");
        const treeRows = await db_service_1.pool.query("SELECT * FROM tree_surveys ORDER BY created_at DESC");
        const sessions = sessRows.rows.map((s) => ({
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
            createdAt: s.created_at,
        }));
        const trees = treeRows.rows.map((t) => ({
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
            createdAt: t.created_at,
        }));
        // Calculate Aggregates
        const totalSurveys = sessions.length;
        const blockIds = new Set(sessions.map((s) => s.blockId));
        const totalBlocksSurveyed = blockIds.size;
        const totalTreesSurveyed = trees.length;
        let tikusCount = 0;
        let tiratabaCount = 0;
        let ulatApiCount = 0;
        let ulatKantungCount = 0;
        trees.forEach((t) => {
            if (t.tikus)
                tikusCount++;
            if (t.tirataba)
                tiratabaCount++;
            if (t.ulatApi)
                ulatApiCount++;
            if (t.ulatKantung)
                ulatKantungCount++;
        });
        // Calculate daily trend
        const trendMap = {};
        trees.forEach((t) => {
            let dateStr = new Date(t.createdAt).toLocaleDateString();
            if (!trendMap[dateStr]) {
                trendMap[dateStr] = { tikus: 0, tirataba: 0, ulatApi: 0, ulatKantung: 0 };
            }
            if (t.tikus)
                trendMap[dateStr].tikus++;
            if (t.tirataba)
                trendMap[dateStr].tirataba++;
            if (t.ulatApi)
                trendMap[dateStr].ulatApi++;
            if (t.ulatKantung)
                trendMap[dateStr].ulatKantung++;
        });
        const attackTrend = Object.keys(trendMap)
            .slice(-7)
            .map((date) => ({
            date,
            ...trendMap[date],
        }));
        // Fallback to demo trend if no survey done yet
        if (attackTrend.length === 0) {
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                attackTrend.push({
                    date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
                    tikus: Math.floor(Math.random() * 5),
                    tirataba: Math.floor(Math.random() * 8),
                    ulatApi: Math.floor(Math.random() * 4),
                    ulatKantung: Math.floor(Math.random() * 6),
                });
            }
        }
        // Recent Survey list
        const recentSurveys = sessions.slice(0, 10).map((s) => {
            const sessionTrees = trees.filter((t) => t.sessionId === s.id);
            const damageCount = sessionTrees.filter((t) => t.tikus || t.tirataba || t.ulatApi || t.ulatKantung).length;
            return {
                id: s.id,
                surveyorName: s.surveyorName,
                afdelingName: "Afdeling " + s.afdelingId,
                blockName: "Block " + s.blockId,
                date: s.tanggal,
                totalTrees: sessionTrees.length,
                damageCount,
                selfieUrl: s.selfieUrl,
            };
        });
        res.json({
            summary: {
                totalSurveys,
                totalBlocksSurveyed,
                totalTreesSurveyed,
            },
            pestCounts: {
                tikus: tikusCount,
                tirataba: tiratabaCount,
                ulatApi: ulatApiCount,
                ulatKantung: ulatKantungCount,
            },
            attackTrend,
            recentSurveys,
        });
    }
    catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});
// GET /api/admin/trees
router.get("/trees", async (req, res) => {
    try {
        const treeRows = await db_service_1.pool.query(`
      SELECT t.*, s.block_id, s.afdeling_id, s.surveyor_name, s.tanggal 
      FROM tree_surveys t
      JOIN survey_sessions s ON t.session_id = s.id
      ORDER BY t.created_at DESC
    `);
        const trees = treeRows.rows.map((t) => ({
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
            createdAt: t.created_at,
            blockId: t.block_id,
            afdelingId: t.afdeling_id,
            surveyorName: t.surveyor_name,
            tanggal: t.tanggal,
        }));
        res.json({ trees });
    }
    catch (error) {
        console.error("Tree data error:", error);
        res.status(500).json({ error: "Failed to fetch tree data" });
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map