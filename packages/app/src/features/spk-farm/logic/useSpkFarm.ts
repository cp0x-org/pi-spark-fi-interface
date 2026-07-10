import { farmAddresses } from '@/config/chain/constants'
import { sortByUsdValueWithUsdsPriority } from '@/domain/common/sorters'
import { TokenWithBalance } from '@/domain/common/types'
import { Farm } from '@/domain/farms/types'
import { useFarmsInfo } from '@/domain/farms/useFarmsInfo'
import { useBlockExplorerLink } from '@/domain/hooks/useBlockExplorerLink'
import { usePageChainId } from '@/domain/hooks/usePageChainId'
import { useOpenDialog } from '@/domain/state/dialogs'
import { useTokenRepositoryForFeature } from '@/domain/token-repository/useTokenRepositoryForFeature'
import { Token } from '@/domain/types/Token'
import { sandboxDialogConfig } from '@/features/dialogs/sandbox/SandboxDialog'
import { stakeDialogConfig } from '@/features/farm-details/dialogs/stake/StakeDialog'
import {
  FarmHistoryQueryResult,
  FarmHistoryTimeframe,
  useFarmHistory,
} from '@/features/farm-details/logic/historic/useFarmHistory'
import { Timeframe } from '@/ui/charts/defaults'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { CheckedAddress } from '@sparkdotfi/common-universal'
import { mainnet } from 'viem/chains'
import { useAccount, useChainId } from 'wagmi'

const SPK_FARM_ADDRESS = farmAddresses[mainnet.id].spkUsds

export interface SpkFarmChartDetails {
  farmHistory: FarmHistoryQueryResult
  onTimeframeChange: (timeframe: Timeframe) => void
  timeframe: FarmHistoryTimeframe
  availableTimeframes: FarmHistoryTimeframe[]
}

export interface UseSpkFarmResult {
  chainId: number
  chainMismatch: boolean
  walletConnected: boolean
  farm: Farm
  tokensToDeposit: TokenWithBalance[]
  hasTokensToDeposit: boolean
  chartDetails: SpkFarmChartDetails
  getBlockExplorerAddressLink: (address: CheckedAddress) => string | undefined
  openStakeDialog: (initialToken: Token) => void
  openDefaultedStakeDialog: () => void
  openConnectModal: () => void
  openSandboxModal: () => void
}

export function useSpkFarm(): UseSpkFarmResult {
  const { chainId } = usePageChainId()
  const connectedChainId = useChainId()
  const { address: account } = useAccount()
  const walletConnected = account !== undefined
  const chainMismatch = walletConnected && connectedChainId !== chainId
  const { openConnectModal = () => {} } = useConnectModal()
  const openDialog = useOpenDialog()
  const blockExplorerLink = useBlockExplorerLink(chainId)

  const { farmsInfo } = useFarmsInfo({ chainId })
  const farm = farmsInfo.findOneFarmByAddress(SPK_FARM_ADDRESS)
  const { farmHistory, onTimeframeChange, timeframe, availableTimeframes } = useFarmHistory({
    chainId,
    farmAddress: SPK_FARM_ADDRESS,
  })
  const { tokenRepository } = useTokenRepositoryForFeature({ chainId, featureGroup: 'farms' })

  const tokensToDeposit = farm.entryAssetsGroup.assets.map((symbol) =>
    tokenRepository.findOneTokenWithBalanceBySymbol(symbol),
  )
  const hasTokensToDeposit = tokensToDeposit.some(({ balance }) => balance.gt(0))
  const mostValuableToken = sortByUsdValueWithUsdsPriority(tokensToDeposit, tokenRepository)[0]

  function openStakeDialog(initialToken: Token): void {
    openDialog(stakeDialogConfig, { farm, initialToken })
  }

  return {
    chainId,
    chainMismatch,
    walletConnected,
    farm,
    tokensToDeposit,
    hasTokensToDeposit,
    chartDetails: {
      farmHistory,
      onTimeframeChange,
      timeframe,
      availableTimeframes,
    },
    getBlockExplorerAddressLink: (address: CheckedAddress) =>
      blockExplorerLink ? `${blockExplorerLink}/address/${address}` : undefined,
    openStakeDialog,
    openDefaultedStakeDialog: () => {
      if (mostValuableToken) {
        openStakeDialog(mostValuableToken.token)
      }
    },
    openConnectModal,
    openSandboxModal: () => openDialog(sandboxDialogConfig, { mode: 'ephemeral' } as const),
  }
}
