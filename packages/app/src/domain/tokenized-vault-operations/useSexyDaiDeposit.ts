import { savingsXDaiAdapterAbi, savingsXDaiAdapterAddress } from '@/config/contracts-generated'
import { toBigInt } from '@/utils/bigNumber'
import { useQueryClient } from '@tanstack/react-query'
import { gnosis } from 'viem/chains'
import { useAccount, useConfig } from 'wagmi'
import { ensureConfigTypes, useWrite } from '../hooks/useWrite'
import { BaseUnitNumber } from '../types/NumericValues'
import { balances } from '../wallet/balances'

export interface UseSexyDaiDepositArgs {
  value: BaseUnitNumber
  onTransactionSettled?: () => void
  enabled?: boolean
}

export function useSexyDaiDeposit({
  value: _value,
  onTransactionSettled,
  enabled: _enabled = true,
}: UseSexyDaiDepositArgs): ReturnType<typeof useWrite> {
  const client = useQueryClient()
  const wagmiConfig = useConfig()

  const { address: receiver } = useAccount()
  const value = toBigInt(_value)

  const config = ensureConfigTypes({
    address: savingsXDaiAdapterAddress[gnosis.id],
    abi: savingsXDaiAdapterAbi,
    functionName: 'depositXDAI',
    args: [receiver!],
    value,
  })
  const enabled = _enabled && value > 0 && !!receiver

  return useWrite(
    {
      ...config,
      enabled,
    },
    {
      onTransactionSettled: async () => {
        void client.invalidateQueries({
          queryKey: balances({ wagmiConfig, chainId: gnosis.id, account: receiver }).queryKey,
        })

        onTransactionSettled?.()
      },
    },
  )
}
