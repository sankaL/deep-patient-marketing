/**
 * Direct SQLite seed script for better-auth.
 *
 * Uses @noble/hashes/scrypt with the exact same parameters as better-auth's
 * @better-auth/utils password module so the stored hash verifies correctly.
 *
 * Hash format: "<saltHex>:<derivedKeyHex>"
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword npx tsx scripts/seed-admin-direct.ts
 */

import { scrypt } from "@noble/hashes/scrypt.js";
import { bytesToHex, randomBytes } from "@noble/hashes/utils.js";
import { DatabaseSync } from "node:sqlite";
import dotenv from "dotenv";

dotenv.config();

const email = (process.env.ADMIN_EMAIL || "evilsanka1008@gmail.com").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || "DeepPatient2026!";
const name = process.env.ADMIN_NAME || "Admin";

// Match better-auth's exact scrypt config (@better-auth/utils/password)
const saltBytes = randomBytes(16);
const saltHex = bytesToHex(saltBytes);
const keyBytes = scrypt(password.normalize("NFKC"), saltHex, {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
});
const passwordHash = `${saltHex}:${bytesToHex(keyBytes)}`;

const db = new DatabaseSync("/app/auth.sqlite");

// Create tables (better-auth schema for email+password)
db.exec(`
  CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt TEXT,
    refreshTokenExpiresAt TEXT,
    scope TEXT,
    password TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    expiresAt TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT,
    updatedAt TEXT
  );
`);

// Check if user already exists
const existing = db.prepare('SELECT id FROM "user" WHERE email = ?').get(email) as
  | { id: string }
  | undefined;

if (existing) {
  db.prepare(`
    UPDATE "account" SET password = ?, updatedAt = ?
    WHERE userId = ? AND providerId = 'credential'
  `).run(passwordHash, new Date().toISOString(), existing.id);

  console.log(`ℹ️  User already exists — password updated.`);
} else {
  const now = new Date().toISOString();
  const userId = bytesToHex(randomBytes(16));
  const accountId = bytesToHex(randomBytes(16));

  db.prepare(`
    INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
    VALUES (?, ?, ?, 1, ?, ?)
  `).run(userId, name, email, now, now);

  db.prepare(`
    INSERT INTO "account" (id, accountId, providerId, userId, password, createdAt, updatedAt)
    VALUES (?, ?, 'credential', ?, ?, ?, ?)
  `).run(accountId, email, userId, passwordHash, now, now);

  console.log(`✅ Admin account created!`);
}

console.log(`   Email:    ${email}`);
console.log(`   Password: ${password}`);

db.close();
