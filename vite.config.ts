import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: { "process.env": {} },
  optimizeDeps: {
    include: ["viem"],
  },
  build: {
    cssMinify: "esbuild",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          wallet: ["wagmi", "viem", "@rainbow-me/rainbowkit", "@wagmi/core"],
          ethers: ["ethers"],
          motion: ["motion"],
          ui: ["lucide-react", "sonner", "radix-ui"],
        },
      },
    },
  },
});
