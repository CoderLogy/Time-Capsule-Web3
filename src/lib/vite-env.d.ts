/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_WALLETCONNECT_ID: string;
  readonly VITE_SUBGRAPH_URL: string;
  readonly VITE_SUBGRAPH_API: string;
  readonly VITE_PINATA_JWT: string;
  readonly VITE_PINATA_GATEWAY: string;
  readonly CRYPTOPRICE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
