import { testSpkStakingConfig } from '@/config/contracts-generated'
import { getContractAddress } from '@/domain/hooks/useContractAddress'
import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { getMockToken, testAddresses } from '@/test/integration/constants'
import { handlers } from '@/test/integration/mockTransport'
import { setupUseContractActionRenderer } from '@/test/integration/setupUseContractActionRenderer'
import { NormalizedUnitNumber } from '@sparkdotfi/common-universal'
import { waitFor } from '@testing-library/react'
import { mainnet } from 'viem/chains'
import { describe, test } from 'vitest'
import { createFinalizeSpkUnstakeActionConfig } from './finalizeSpkUnstakeAction'

const account = testAddresses.alice
const chainId = mainnet.id
const vault = getContractAddress(testSpkStakingConfig.address, chainId)
const spk = getMockToken({ symbol: TokenSymbol('SPK') })
const amount = NormalizedUnitNumber(100)

const hookRenderer = setupUseContractActionRenderer({
  account,
  handlers: [handlers.chainIdCall({ chainId })],
  args: {
    action: {
      spk,
      amount,
      type: 'finalizeSpkUnstake',
      epochs: [1, 2],
    },
    enabled: true,
  },
})

describe(createFinalizeSpkUnstakeActionConfig.name, () => {
  test('finalizes spark token unstake', async () => {
    const { result } = hookRenderer({
      extraHandlers: [
        handlers.contractCall({
          to: vault,
          abi: testSpkStakingConfig.abi,
          functionName: 'claimBatch',
          args: [account, [1n, 2n]],
          from: account,
          result: 100n,
        }),
        handlers.mineTransaction(),
      ],
    })

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })

    result.current.onAction()

    await waitFor(() => {
      expect(result.current.state.status).toBe('success')
    })
  })
})
