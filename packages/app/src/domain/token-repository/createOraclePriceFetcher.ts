import { TokenConfig } from '@/config/chain/types'
import { ssrAuthOracleConfig } from '@/config/contracts-generated'
import { getContractAddress } from '@/domain/hooks/useContractAddress'
import { fromRay } from '@/utils/math'
import { bigNumberify } from '@sparkdotfi/common-universal'
import { CheckedAddress, NormalizedUnitNumber, assertNever } from '@sparkdotfi/common-universal'
import { erc4626Abi, formatUnits, parseUnits } from 'viem'
import { Config } from 'wagmi'
import { readContract } from 'wagmi/actions'

export interface CreateOraclePriceFetcherParams {
  tokenConfig: TokenConfig
  wagmiConfig: Config
  chainId: number
}

export function createOraclePriceFetcher({
  tokenConfig,
  wagmiConfig,
  chainId,
}: CreateOraclePriceFetcherParams): () => Promise<NormalizedUnitNumber> {
  switch (tokenConfig.oracleType) {
    case 'zero-price':
      return async () => NormalizedUnitNumber(0)

    case 'fixed-usd':
      return async () => NormalizedUnitNumber(1)

    case 'vault':
      return async () => {
        const sharesDecimals = tokenConfig.sharesDecimals ?? 18
        const assetsDecimals = tokenConfig.assetsDecimals ?? 18

        const [result, underlyingPriceUsd] = await Promise.all([
          readContract(wagmiConfig, {
            abi: erc4626Abi,
            address: tokenConfig.address,
            functionName: 'convertToAssets',
            args: [parseUnits('1', sharesDecimals)],
            chainId,
          }),
          tokenConfig.underlyingPriceFeed
            ? fetchChainlinkUsdPrice({ wagmiConfig, chainId, priceFeed: tokenConfig.underlyingPriceFeed })
            : Promise.resolve(NormalizedUnitNumber(1)),
        ])

        return NormalizedUnitNumber(
          NormalizedUnitNumber(formatUnits(result, assetsDecimals)).multipliedBy(underlyingPriceUsd),
        )
      }

    case 'chainlink-usd':
      return () => fetchChainlinkUsdPrice({ wagmiConfig, chainId, priceFeed: tokenConfig.priceFeed })

    case 'ssr-auth-oracle':
      return async () => {
        const result = await readContract(wagmiConfig, {
          abi: ssrAuthOracleConfig.abi,
          address: getContractAddress(ssrAuthOracleConfig.address, chainId),
          functionName: 'getConversionRate',
          chainId,
        })

        return NormalizedUnitNumber(fromRay(bigNumberify(result)))
      }

    default:
      assertNever(tokenConfig)
  }
}

const chainlinkAggregatorAbi = [
  {
    inputs: [],
    name: 'latestAnswer',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface FetchChainlinkUsdPriceParams {
  wagmiConfig: Config
  chainId: number
  priceFeed: CheckedAddress
}

async function fetchChainlinkUsdPrice({
  wagmiConfig,
  chainId,
  priceFeed,
}: FetchChainlinkUsdPriceParams): Promise<NormalizedUnitNumber> {
  const [latestAnswer, decimals] = await Promise.all([
    readContract(wagmiConfig, {
      abi: chainlinkAggregatorAbi,
      address: priceFeed,
      functionName: 'latestAnswer',
      chainId,
    }),
    readContract(wagmiConfig, {
      abi: chainlinkAggregatorAbi,
      address: priceFeed,
      functionName: 'decimals',
      chainId,
    }),
  ])

  return NormalizedUnitNumber(formatUnits(latestAnswer, decimals))
}
