import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import syncRoutes from "./routes/sync.routes";
import adminRoutes from "./routes/admin.routes";
import { initDb } from "./services/db.service";

dotenv.config();

// Initialize Database connection (async non-blocking)
initDb();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Export the Express app as a Firebase Cloud Function
export const api = functions.https.onRequest(app);
