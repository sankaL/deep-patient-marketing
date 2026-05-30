import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { auth } from "./auth";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const app = new Hono();

// Expose health check
app.get("/health", (c) => c.text("ok"));

// Mount Better Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Proxy `/api/*` requests to the FastAPI backend (except Better Auth routes)
app.all("/api/*", async (c) => {
  const backendUrl = process.env.BACKEND_UPSTREAM_URL || "http://127.0.0.1:8000";
  
  const destUrl = `${backendUrl.replace(/\/$/, "")}${c.req.path}${new URL(c.req.url).search}`;
  const headers = new Headers(c.req.raw.headers);
  headers.set("Host", new URL(backendUrl).host);
  
  // Verify Better Auth session and securely forward the authenticated email
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (session && session.user) {
      headers.set("x-admin-email", session.user.email);
    }
  } catch (error) {
    console.error("Error validating proxy session:", error);
  }
  
  try {
    const res = await fetch(destUrl, {
      method: c.req.method,
      headers: headers,
      body: ["GET", "HEAD"].includes(c.req.method) ? undefined : await c.req.raw.arrayBuffer(),
      redirect: "manual",
    });
    
    return new Response(res.body, {
      status: res.status,
      headers: new Headers(res.headers),
    });
  } catch (error) {
    console.error(`Proxy error: ${error}`);
    return c.text("Backend API is unavailable.", 503);
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(process.cwd(), "dist");
  
  // Serve built assets
  app.use("/*", serveStatic({ root: "./dist" }));
  
  // SPA routing: Fallback to index.html for all other routes
  app.get("/*", async (c) => {
    const htmlPath = path.join(distPath, "index.html");
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, "utf-8");
      return c.html(html);
    }
    return c.text("Not found", 404);
  });
}

const port = parseInt(process.env.PORT || "3001");
console.log(`Hono auth & proxy server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port: port,
});
