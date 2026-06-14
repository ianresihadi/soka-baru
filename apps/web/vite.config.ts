import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_TARGET = process.env.VITE_API_TARGET ?? "http://localhost:8787";

// Proxy foundation/auth routes to the Hono API during local development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
      "/me": { target: API_TARGET, changeOrigin: true },
      "/school-bindings": { target: API_TARGET, changeOrigin: true },
      "/tenant-check": { target: API_TARGET, changeOrigin: true },
      "/health": { target: API_TARGET, changeOrigin: true },
    },
  },
});
