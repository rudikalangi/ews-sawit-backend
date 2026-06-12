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
exports.handlePhotoStorage = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const functions = __importStar(require("firebase-functions"));
const uuid_1 = require("uuid");
// Config mapping (use process.env for local development with .env, fallback to Firebase config in production)
const accessKeyId = process.env.R2_ACCESS_KEY_ID || functions.config().r2?.key_id;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || functions.config().r2?.secret_key;
const bucketName = process.env.R2_BUCKET_NAME || functions.config().r2?.bucket_name;
const endpoint = process.env.R2_ENDPOINT || functions.config().r2?.endpoint;
const publicUrlPrefix = process.env.R2_PUBLIC_URL || functions.config().r2?.public_url;
let s3Client = null;
if (accessKeyId && secretAccessKey && endpoint) {
    s3Client = new client_s3_1.S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
    functions.logger.info("☁️ Cloudflare R2 Client Initialized");
}
/**
 * Handle base64 photo storage and return the public URL or file path.
 */
const handlePhotoStorage = async (base64Data, prefix = "img") => {
    if (!base64Data)
        return "";
    if (!base64Data.startsWith("data:image")) {
        return base64Data; // Likely already a URL
    }
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return base64Data;
    }
    const type = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "png";
    const filename = `${prefix}_${Date.now()}_${(0, uuid_1.v4)().substring(0, 8)}.${ext}`;
    if (s3Client && bucketName) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: filename,
                Body: buffer,
                ContentType: type,
                ACL: "public-read", // Or configure the bucket policy for public reads
            });
            await s3Client.send(command);
            functions.logger.info(`✅ Uploaded to R2: ${filename}`);
            // Return the public URL if configured, else fallback to endpoint logic
            if (publicUrlPrefix) {
                return `${publicUrlPrefix.replace(/\/$/, "")}/${filename}`;
            }
            else {
                // Construct basic public R2 URL (often needs a custom domain set in CF dashboard)
                const baseUrl = endpoint.replace("https://", "https://pub-").split(".r2.cloudflarestorage.com")[0];
                return `${baseUrl}.r2.dev/${filename}`;
            }
        }
        catch (error) {
            functions.logger.error("❌ Failed to upload to Cloudflare R2", error);
            // Fallback: Just return a dummy local path or base64 if R2 fails
            return base64Data;
        }
    }
    // Fallback to returning base64 if R2 isn't configured
    functions.logger.warn("⚠️ Cloudflare R2 is not configured. Saving photo as base64 string.");
    return base64Data;
};
exports.handlePhotoStorage = handlePhotoStorage;
//# sourceMappingURL=storage.service.js.map