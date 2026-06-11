import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri expects a fixed dev port and no auto-open
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    // PORT é injetado pelo preview do Claude; Tauri dev usa 5173
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
  },
  build: {
    target: "es2021",
    outDir: "dist",
  },
});
