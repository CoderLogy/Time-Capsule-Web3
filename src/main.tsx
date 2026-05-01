import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/raleway";
import "@fontsource/cormorant-garamond";
import "./index.css";
import App from "./App.tsx";
import { Buffer } from "buffer";
import { initializeAmplitude } from "@/lib/amplitude";

window.Buffer = Buffer;
initializeAmplitude();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
