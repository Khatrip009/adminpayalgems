import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Custom domain → root path
  base: "/",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // DEV ONLY
  ...(mode === "development" && {
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "https://apiminalgems.exotech.co.in",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        "/uploads": {
          target: "https://apiminalgems.exotech.co.in",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }),

  // BUILD
  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  },
}));
