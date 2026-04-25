import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/raleway";
import "@fontsource/cormorant-garamond";
import "./index.css";
import App from "./App.tsx";
import { Buffer } from "buffer";

// ✅ Polyfill Buffer for browser
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

// ✅ Only mount React in a real browser environment.
//    This prevents Vercel's SSR prerender from touching
//    localStorage, window, or document during build.
if (typeof window !== "undefined" && typeof document !== "undefined") {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}