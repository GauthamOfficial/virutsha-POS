import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Reachable from a phone or tablet on the same Wi-Fi during development.
    host: true,
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 900,
  },
});
