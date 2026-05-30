import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { createAuthMiddleware, APIError } from "better-auth/api";
import dotenv from "dotenv";

dotenv.config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});


const allowedEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

if (allowedEmails.length === 0 && process.env.ADMIN_EMAIL) {
  allowedEmails.push(process.env.ADMIN_EMAIL.trim().toLowerCase());
}

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwt",
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        const body = ctx.body as any;
        const email = (body?.email || "").trim().toLowerCase();
        
        if (!email || !allowedEmails.includes(email)) {
          throw new APIError("BAD_REQUEST", {
            message: "Sign-up is not allowed for this email address.",
          });
        }
      }
    }),
  },
});
export type Auth = typeof auth;
