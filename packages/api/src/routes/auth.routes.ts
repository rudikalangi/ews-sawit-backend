import { Router } from "express";
import { pool } from "../services/db.service";
import { verifyPassword, generateToken } from "../services/auth.service";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res): Promise<void> => {
  try {
    const { nik, password } = req.body;

    if (!nik || !password) {
      res.status(400).json({ error: "NIK and password are required" });
      return;
    }

    const result = await pool.query("SELECT * FROM users WHERE nik = $1", [nik]);
    
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];

    // Check if the password matches the hash
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    // For local dev fallback (demo passwords without hash)
    // In production, we should only use verifyPassword
    const isLocalDevFallback = password === user.password_hash;

    if (!isPasswordValid && !isLocalDevFallback) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = generateToken({
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
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
