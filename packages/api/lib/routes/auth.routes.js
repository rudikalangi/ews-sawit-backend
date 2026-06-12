"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_service_1 = require("../services/db.service");
const auth_service_1 = require("../services/auth.service");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { nik, password } = req.body;
        if (!nik || !password) {
            res.status(400).json({ error: "NIK and password are required" });
            return;
        }
        const result = await db_service_1.pool.query("SELECT * FROM users WHERE nik = $1", [nik]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const user = result.rows[0];
        // Check if the password matches the hash
        const isPasswordValid = await (0, auth_service_1.verifyPassword)(password, user.password_hash);
        // For local dev fallback (demo passwords without hash)
        // In production, we should only use verifyPassword
        const isLocalDevFallback = password === user.password_hash;
        if (!isPasswordValid && !isLocalDevFallback) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        // Generate JWT token
        const token = (0, auth_service_1.generateToken)({
            nik: user.nik,
            name: user.name,
            role: user.role
        });
        res.json({
            success: true,
            token,
            user: {
                nik: user.nik,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map