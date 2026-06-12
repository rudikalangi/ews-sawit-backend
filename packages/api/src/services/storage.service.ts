import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as functions from "firebase-functions";
import { v4 as uuidv4 } from "uuid";

// Config mapping (use process.env for local development with .env, fallback to Firebase config in production)
const accessKeyId = process.env.R2_ACCESS_KEY_ID || functions.config().r2?.key_id;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || functions.config().r2?.secret_key;
const bucketName = process.env.R2_BUCKET_NAME || functions.config().r2?.bucket_name;
const endpoint = process.env.R2_ENDPOINT || functions.config().r2?.endpoint;
const publicUrlPrefix = process.env.R2_PUBLIC_URL || functions.config().r2?.public_url;

let s3Client: S3Client | null = null;

if (accessKeyId && secretAccessKey && endpoint) {
  s3Client = new S3Client({
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
export const handlePhotoStorage = async (base64Data: string | undefined, prefix: string = "img"): Promise<string> => {
  if (!base64Data) return "";
  
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
  const filename = `${prefix}_${Date.now()}_${uuidv4().substring(0, 8)}.${ext}`;

  if (s3Client && bucketName) {
    try {
      const command = new PutObjectCommand({
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
      } else {
        // Construct basic public R2 URL (often needs a custom domain set in CF dashboard)
        const baseUrl = endpoint.replace("https://", "https://pub-").split(".r2.cloudflarestorage.com")[0];
        return `${baseUrl}.r2.dev/${filename}`;
      }
    } catch (error) {
      functions.logger.error("❌ Failed to upload to Cloudflare R2", error);
      // Fallback: Just return a dummy local path or base64 if R2 fails
      return base64Data;
    }
  }

  // Fallback to returning base64 if R2 isn't configured
  functions.logger.warn("⚠️ Cloudflare R2 is not configured. Saving photo as base64 string.");
  return base64Data;
};
