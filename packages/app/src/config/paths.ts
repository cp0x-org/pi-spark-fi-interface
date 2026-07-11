import { ChainConfigEntry } from './chain/types'

export const paths = {
  easyBorrow: '/borrow',
  myPortfolio: '/my-portfolio',
  markets: '/markets',
  savings: '/',
  swap: '/swap',
  farms: '/farms',
  marketDetails: '/markets/:chainId/:asset',
  farmDetails: '/farms/:chainId/:address',
  sparkRewards: '/rewards',
  spkStaking: '/spk/staking',
  spkFarm: '/spk/farm',
  spkGovernance: '/spk/governance',
} as const

export type Path = keyof typeof paths

export const pathGroups = {
  borrow: ['easyBorrow', 'myPortfolio', 'markets', 'marketDetails'],
  savings: ['savings'],
  swap: ['swap'],
  farms: ['farms', 'farmDetails'],
  sparkRewards: ['sparkRewards'],
  sparkToken: ['spkStaking', 'spkFarm', 'spkGovernance'],
} satisfies Record<'borrow' | 'savings' | 'swap' | 'farms' | 'sparkRewards' | 'sparkToken', Path[]>

export type PathGroup = keyof typeof pathGroups

export function getSupportedPages(chainConfigEntry: ChainConfigEntry): Path[] {
  return [
    ...(chainConfigEntry.markets ? pathGroups.borrow : []),
    ...(chainConfigEntry.savings ? pathGroups.savings : []),
    ...(chainConfigEntry.savings?.psmStables ? pathGroups.swap : []),
    ...(chainConfigEntry.farms ? pathGroups.farms : []),
    ...(import.meta.env.VITE_DEV_SPARK_REWARDS === '1' ? pathGroups.sparkRewards : []),
    ...(import.meta.env.VITE_DEV_SPARK_TOKEN === '1' && chainConfigEntry.sparkToken ? pathGroups.sparkToken : []),
  ]
}
