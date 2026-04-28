// Simple logging for development

const isDev = import.meta.env.DEV;

// Log warning
export function warn(label: string, message?: unknown): void {
  console.warn(`[${label}]`, message ?? '');
}

// Log error
export function error(label: string, err?: unknown): void {
  console.error(`[${label}]`, err ?? '');
}

// Log debug (only in dev)
export function debug(label: string, data?: unknown): void {
  if (isDev) console.log(`[${label}]`, data ?? '');
}
