import { sparkVaultAbi } from '@/config/abis/sparkVaultAbi'
import { getChainConfigEntry } from '@/config/chain'
import { SavingsConverterQuery } from '@/config/chain/types'
import { bigNumberify } from '@sparkdotfi/common-universal'
import { raise } from '@sparkdotfi/common-universal'
import { QueryKey, queryOptions } from '@tanstack/react-query'
import { multicall } from 'wagmi/actions'
import { TokenSymbol } from '../types/TokenSymbol'
import { PotSavingsConverter } from './PotSavingsConverter'
import { SavingsConverterQueryOptions, SavingsConverterQueryParams } from './types'

// @note: Spark Savings vaults accrue interest like the Maker pot,
// but the rate is called vsr (Vault Savings Rate) instead of dsr/ssr.
export function sparkVaultConverterQueryFactory(savingsTokenSymbol: TokenSymbol): SavingsConverterQuery {
  return function sparkVaultConverterQuery({
    wagmiConfig,
    timestamp,
    chainId,
  }: SavingsConverterQueryParams): SavingsConverterQueryOptions {
    return queryOptions({
      queryKey: ['savings-info', savingsTokenSymbol, { chainId }] as QueryKey,
      queryFn: async () => {
        const chainConfig = getChainConfigEntry(chainId)
        const savingsTokenAddress =
          chainConfig.definedTokens.find(({ symbol }) => symbol === savingsTokenSymbol)?.address ??
          raise(`${savingsTokenSymbol} address not found`)

        const [vsr, rho, chi] = await multicall(wagmiConfig, {
          allowFailure: false,
          contracts: [
            {
              address: savingsTokenAddress,
              functionName: 'vsr',
              args: [],
              abi: sparkVaultAbi,
            },
            {
              address: savingsTokenAddress,
              functionName: 'rho',
              args: [],
              abi: sparkVaultAbi,
            },
            {
              address: savingsTokenAddress,
              functionName: 'chi',
              args: [],
              abi: sparkVaultAbi,
            },
          ],
        })

        return {
          vsr,
          rho,
          chi,
        }
      },
      select: ({ vsr, rho, chi }) => {
        return new PotSavingsConverter({
          potParams: {
            dsr: bigNumberify(vsr),
            rho: bigNumberify(rho),
            chi: bigNumberify(chi),
          },
          currentTimestamp: timestamp,
        })
      },
    })
  }
}
