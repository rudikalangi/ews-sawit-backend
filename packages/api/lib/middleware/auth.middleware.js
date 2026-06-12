"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const auth_service_1 = require("../services/auth.service");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized. Missing or invalid Bearer token" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = (0, auth_service_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Unauthorized. Token expired or invalid" });
        return;
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (req.user.role !== "admin") {
        res.status(403).json({ error: "Forbidden. Admin access required" });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.middleware.js.map