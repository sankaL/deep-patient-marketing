/**
 * Seed script: creates an admin account in the better-auth SQLite database.
 *
 * Usage (inside the frontend container or locally):
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword npx tsx scripts/seed-admin.ts
 *
 * Defaults (for local dev convenience):
 *   email:    admin@deeppatient.io
 *   password: DeepPatient2026!
 */

import { betterAuth } from "better-auth";
import { DatabaseSync } from "node:sqlite";
import dotenv from "dotenv";

dotenv.config();

const email = process.env.ADMIN_EMAIL || "admin@deeppatient.io";
const password = process.env.ADMIN_PASSWORD || "DeepPatient2026!";
const name = process.env.ADMIN_NAME || "Admin";

// Allow the seeded email unconditionally — bypass the allowlist guard.
process.env.ADMIN_EMAILS = [process.env.ADMIN_EMAILS || "", email]
  .filter(Boolean)
  .join(",");

const db = new DatabaseSync("auth.sqlite");

const auth = betterAuth({
  database: db,
  emailAndPassword: { enabled: true },
});

console.log(`Seeding admin account: ${email}`);

try {
  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  // better-auth returns the user object on success
  if (result && result.user) {
    console.log(`✅ Admin account created successfully!`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
  } else {
    console.log(`✅ Done. Response:`, JSON.stringify(result, null, 2));
  }
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exist")) {
    console.log(`ℹ️  Account already exists for ${email} — no changes made.`);
  } else {
    console.error("❌ Failed to create admin:", msg);
    process.exit(1);
  }
}

db.close();
