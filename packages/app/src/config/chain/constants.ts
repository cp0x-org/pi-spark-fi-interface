import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { CheckedAddress } from '@sparkdotfi/common-universal'
import { arbitrum, base, gnosis, mainnet } from 'viem/chains'
import { AssetsGroup } from './types'

export const SUPPORTED_CHAINS = [
  mainnet,
  base,
  ...(import.meta.env.VITE_FEATURE_ARBITRUM === '1' ? [arbitrum] : []),
  gnosis,
] as const
export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((chain) => chain.id)

export const farmStablecoinsEntryGroup: Record<1 | 8453, AssetsGroup> = {
  [mainnet.id]: {
    type: 'stablecoins',
    name: 'Stablecoins',
    assets: [TokenSymbol('DAI'), TokenSymbol('USDC'), TokenSymbol('USDS'), TokenSymbol('sDAI'), TokenSymbol('sUSDS')],
  },
  [base.id]: {
    type: 'stablecoins',
    name: 'Stablecoins',
    assets: [TokenSymbol('USDS'), TokenSymbol('sUSDS'), TokenSymbol('USDC')],
  },
}

export const farmAddresses = {
  [mainnet.id]: {
    chroniclePoints: CheckedAddress('0x10ab606B067C9C461d8893c47C7512472E19e2Ce'),
    skyUsds: CheckedAddress('0x0650CAF159C5A49f711e8169D4336ECB9b950275'),
  },
  [base.id]: {
    skyUsds: CheckedAddress('0x711b139b1f20DFc4416bFf875402015aeB05B4F2'),
  },
} as const

export const susdsAddresses = {
  [mainnet.id]: CheckedAddress('0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD'),
} as const

export interface SparkVaultConfig {
  savingsTokenSymbol: TokenSymbol
  underlyingTokenSymbol: TokenSymbol
  address: CheckedAddress
}

// @note: Spark Savings vaults (VSR-based, share the same ABI - sparkVaultAbi)
export const sparkVaults: Record<1, SparkVaultConfig[]> = {
  [mainnet.id]: [
    {
      savingsTokenSymbol: TokenSymbol('spUSDC'),
      underlyingTokenSymbol: TokenSymbol('USDC'),
      address: CheckedAddress('0x28B3a8fb53B741A8Fd78c0fb9A6B2393d896a43d'),
    },
    {
      savingsTokenSymbol: TokenSymbol('spUSDT'),
      underlyingTokenSymbol: TokenSymbol('USDT'),
      address: CheckedAddress('0xe2e7a17dFf93280dec073C995595155283e3C372'),
    },
    {
      savingsTokenSymbol: TokenSymbol('spPYUSD'),
      underlyingTokenSymbol: TokenSymbol('PYUSD'),
      address: CheckedAddress('0x80128DbB9f07b93DDE62A6daeadb69ED14a7D354'),
    },
    {
      savingsTokenSymbol: TokenSymbol('spETH'),
      underlyingTokenSymbol: TokenSymbol('WETH'),
      address: CheckedAddress('0xfE6eb3b609a7C8352A241f7F3A21CEA4e9209B8f'),
    },
  ],
}

export function findSparkVaultBySavingsTokenSymbol(savingsTokenSymbol: TokenSymbol): SparkVaultConfig | undefined {
  return sparkVaults[mainnet.id].find((vault) => vault.savingsTokenSymbol === savingsTokenSymbol)
}

export function isSparkVaultPair({
  tokenSymbol,
  savingsTokenSymbol,
}: { tokenSymbol: TokenSymbol; savingsTokenSymbol: TokenSymbol }): boolean {
  const vault = findSparkVaultBySavingsTokenSymbol(savingsTokenSymbol)
  return vault !== undefined && vault.underlyingTokenSymbol === tokenSymbol
}
