import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ✅ Don't define process.env as empty object — it breaks wagmi's
  //    internal environment checks and SSR detection logic.
  //    Use import.meta.env instead in your code.
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["viem"],
  },
  build: {
    cssMinify: "esbuild",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep wagmi + rainbowkit in a single lazy chunk so their
          // module-level code runs only after the browser is ready.
          // Do NOT split them apart — wagmi reads localStorage at
          // module evaluation time and must run client-side only.
          if (
            id.includes("wagmi") ||
            id.includes("@wagmi") ||
            id.includes("@rainbow-me") ||
            id.includes("viem") ||
            id.includes("@tanstack/react-query")
          ) {
            return "wallet";
          }
          if (id.includes("ethers")) return "ethers";
          if (id.includes("motion")) return "motion";
          if (id.includes("react-dom")) return "react-dom";
          if (id.includes("react")) return "react-vendor";
        },
      },
    },
  },
});