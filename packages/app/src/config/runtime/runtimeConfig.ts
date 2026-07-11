// Runtime configuration injected via `public/config.js`.
// The file is loaded at runtime (before the app bundle), so it can be overridden
// per-deployment (e.g. mounted through docker-compose) without rebuilding the app.
// When the file is absent, or a value is missing/empty, the app falls back to its defaults.

export interface RuntimeConfig {
  rpcUrls?: Partial<Record<number, string>>
}

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig
  }
}

export function getRuntimeRpcUrl(chainId: number): string | undefined {
  const url = typeof window !== 'undefined' ? window.__APP_CONFIG__?.rpcUrls?.[chainId] : undefined
  return typeof url === 'string' && url.length > 0 ? url : undefined
}
