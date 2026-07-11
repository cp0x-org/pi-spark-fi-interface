// Runtime configuration, loaded at runtime (not baked into the build).
// Mount/override this file (e.g. via docker-compose) to change RPC URLs without rebuilding.
// Any missing chain / empty URL falls back to the default RPC configured in the app.
window.__APP_CONFIG__ = {
  rpcUrls: {
    // Ethereum Mainnet (chainId 1)
    1: '',
    // Gnosis (chainId 100)
    100: '',
    // Base (chainId 8453)
    8453: '',
    // Arbitrum One (chainId 42161)
    42161: '',
  },
}
