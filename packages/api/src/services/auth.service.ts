import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as functions from "firebase-functions";

// For local testing vs deployed env
const JWT_SECRET = process.env.JWT_SECRET || functions.config().jwt?.secret || "default-dev-secret-key-12345";
const JWT_EXPIRES_IN = "7d"; // Access token expires in 7 days for mobile app convenience

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (payload: { nik: string; name: string; role: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
