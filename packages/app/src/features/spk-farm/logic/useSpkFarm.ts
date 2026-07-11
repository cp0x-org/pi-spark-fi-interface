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
import { claimDialogConfig } from '@/features/farm-details/dialogs/claim/ClaimDialog'
import { stakeDialogConfig } from '@/features/farm-details/dialogs/stake/StakeDialog'
import { unstakeDialogConfig } from '@/features/farm-details/dialogs/unstake/UnstakeDialog'
import { calculateReward as calculateFarmReward } from '@/features/farm-details/logic/calculateReward'
import {
  FarmHistoryQueryResult,
  FarmHistoryTimeframe,
  useFarmHistory,
} from '@/features/farm-details/logic/historic/useFarmHistory'
import { Timeframe } from '@/ui/charts/defaults'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { CheckedAddress, NormalizedUnitNumber } from '@sparkdotfi/common-universal'
import { Address, getAddress, isAddress } from 'viem'
import { mainnet } from 'viem/chains'
import { useAccount, useChainId } from 'wagmi'
import { useSearchParams } from 'react-router-dom'

const SPK_FARM_ADDRESS = farmAddresses[mainnet.id].spkUsds
const GROWING_REWARD_REFRESH_INTERVAL_IN_MS = 50

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
  isFarmActive: boolean
  canClaim: boolean
  chartDetails: SpkFarmChartDetails
  calculateReward: (timestampInMs: number) => NormalizedUnitNumber
  refreshGrowingRewardIntervalInMs: number | undefined
  getBlockExplorerAddressLink: (address: CheckedAddress) => string | undefined
  openStakeDialog: (initialToken: Token) => void
  openDefaultedStakeDialog: () => void
  openClaimDialog: () => void
  openUnstakeDialog: () => void
  openConnectModal: () => void
}

export function useSpkFarm(): UseSpkFarmResult {
  const { chainId } = usePageChainId()
  const connectedChainId = useChainId()
  const { address: account } = useAccount()
  const viewAccount = useViewAccount()
  const readAccount = account ?? viewAccount
  const walletConnected = account !== undefined
  const chainMismatch = walletConnected && connectedChainId !== chainId
  const { openConnectModal = () => {} } = useConnectModal()
  const openDialog = useOpenDialog()
  const blockExplorerLink = useBlockExplorerLink(chainId)

  const { farmsInfo } = useFarmsInfo({ chainId, account: readAccount })
  const farm = farmsInfo.findOneFarmByAddress(SPK_FARM_ADDRESS)
  const { farmHistory, onTimeframeChange, timeframe, availableTimeframes } = useFarmHistory({
    chainId,
    farmAddress: SPK_FARM_ADDRESS,
  })
  const { tokenRepository } = useTokenRepositoryForFeature({ chainId, featureGroup: 'farms', account: readAccount })

  const tokensToDeposit = farm.entryAssetsGroup.assets.map((symbol) =>
    tokenRepository.findOneTokenWithBalanceBySymbol(symbol),
  )
  const hasTokensToDeposit = tokensToDeposit.some(({ balance }) => balance.gt(0))
  const mostValuableToken = sortByUsdValueWithUsdsPriority(tokensToDeposit, tokenRepository)[0]

  function openStakeDialog(initialToken: Token): void {
    openDialog(stakeDialogConfig, { farm, initialToken })
  }

  function calculateReward(timestampInMs: number): NormalizedUnitNumber {
    return calculateFarmReward({
      earned: farm.earned,
      staked: farm.staked,
      rewardRate: farm.rewardRate,
      earnedTimestamp: farm.earnedTimestamp,
      periodFinish: farm.periodFinish,
      timestampInMs,
      totalSupply: farm.totalSupply,
    })
  }

  const canClaim = farm.earned.gt(0) || farm.rewardRate.gt(0)

  return {
    chainId,
    chainMismatch,
    walletConnected,
    farm,
    tokensToDeposit,
    hasTokensToDeposit,
    isFarmActive: farm.staked.gt(0) || farm.earned.gt(0),
    canClaim,
    chartDetails: {
      farmHistory,
      onTimeframeChange,
      timeframe,
      availableTimeframes,
    },
    calculateReward,
    refreshGrowingRewardIntervalInMs:
      farm.staked.gt(0) && farm.rewardRate.gt(0) ? GROWING_REWARD_REFRESH_INTERVAL_IN_MS : undefined,
    getBlockExplorerAddressLink: (address: CheckedAddress) =>
      blockExplorerLink ? `${blockExplorerLink}/address/${address}` : undefined,
    openStakeDialog,
    openDefaultedStakeDialog: () => {
      if (mostValuableToken) {
        openStakeDialog(mostValuableToken.token)
      }
    },
    openClaimDialog: () => (walletConnected ? openDialog(claimDialogConfig, { farm }) : openConnectModal()),
    openUnstakeDialog: () =>
      walletConnected ? openDialog(unstakeDialogConfig, { farm, initialToken: farm.stakingToken }) : openConnectModal(),
    openConnectModal,
  }
}

function useViewAccount(): Address | undefined {
  const [searchParams] = useSearchParams()
  const rawAddress = searchParams.get('viewAddress') ?? searchParams.get('account') ?? searchParams.get('address')

  if (!rawAddress || !isAddress(rawAddress)) {
    return undefined
  }

  return getAddress(rawAddress)
}
