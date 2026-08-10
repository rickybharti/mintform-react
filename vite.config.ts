import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build:
    mode === "demo"
      ? {
          // The demo must never overwrite the distributable library files.
          outDir: "dist-demo",
          rollupOptions: {
            input: {
              demo: resolve(import.meta.dirname, "index.html"),
              performance: resolve(import.meta.dirname, "performance.html"),
            },
          },
        }
      : {
          outDir: "dist",
          lib: {
            entry: resolve(import.meta.dirname, "src/index.ts"),
            formats: ["es", "cjs"],
            fileName: "index",
            cssFileName: "mintform",
          },
          rollupOptions: {
            external: [
              "react",
              "react-dom",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
            ],
          },
        },
}));
