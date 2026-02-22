/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PINATA_JWT: string;
    readonly VITE_PINATA_GATEWAY: string;
    readonly VITE_SUBGRAPH_API: string;
    // add more VITE_ env vars here
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
