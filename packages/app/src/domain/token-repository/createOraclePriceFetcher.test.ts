import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { getMockToken } from '@/test/integration/constants'
import { CheckedAddress } from '@sparkdotfi/common-universal'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createOraclePriceFetcher } from './createOraclePriceFetcher'

const farmAddress = CheckedAddress('0x173e314C7635B45322cd8Cb14f44b312e079F3af')

const tokenConfig = {
  symbol: TokenSymbol('SPK'),
  address: getMockToken({ symbol: TokenSymbol('SPK') }).address,
  oracleType: 'farm-reward-price',
  farmAddress,
} as const

describe(createOraclePriceFetcher.name, () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('fetches farm reward token price from the farms api', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      expect(url).toBe(`/info-sky-api/farms/${farmAddress.toLowerCase()}/`)
      return {
        ok: true,
        json: () => Promise.resolve({ price: '0.017547005600000000', apy: '0.0356' }),
      }
    })

    const fetchPrice = createOraclePriceFetcher({ tokenConfig, wagmiConfig: {} as any, chainId: 1 })
    const price = await fetchPrice()

    expect(price.toFixed()).toBe('0.0175470056')
  })

  test('returns zero when the farms api is unavailable', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false }))

    const fetchPrice = createOraclePriceFetcher({ tokenConfig, wagmiConfig: {} as any, chainId: 1 })
    const price = await fetchPrice()

    expect(price.toFixed()).toBe('0')
  })
})
