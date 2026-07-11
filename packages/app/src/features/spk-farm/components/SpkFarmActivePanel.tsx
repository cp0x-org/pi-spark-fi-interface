import { formatPercentage } from '@/domain/common/format'
import { Farm } from '@/domain/farms/types'
import { getTokenImage } from '@/ui/assets'
import { Button } from '@/ui/atoms/button/Button'
import { cn } from '@/ui/utils/style'
import { getFractionalPart, getWholePart } from '@/utils/bigNumber'
import { useTimestamp } from '@/utils/useTimestamp'
import { NormalizedUnitNumber } from '@sparkdotfi/common-universal'

export interface SpkFarmActivePanelProps {
  farm: Farm
  canClaim: boolean
  walletConnected: boolean
  chainMismatch: boolean
  calculateReward: (timestampInMs: number) => NormalizedUnitNumber
  refreshGrowingRewardIntervalInMs: number | undefined
  openClaimDialog: () => void
  openUnstakeDialog: () => void
}

export function SpkFarmActivePanel({
  farm,
  canClaim,
  walletConnected,
  chainMismatch,
  calculateReward,
  refreshGrowingRewardIntervalInMs,
  openClaimDialog,
  openUnstakeDialog,
}: SpkFarmActivePanelProps) {
  const actionsDisabled = !walletConnected || chainMismatch

  return (
    <section
      className={cn(
        'relative isolate flex min-h-[414px] flex-col overflow-hidden rounded-sm bg-farm-cta-panel bg-cover',
        'px-6 py-7 text-primary-inverse sm:px-8 md:px-10',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="typography-heading-5 text-primary-inverse">My Rewards</div>
        <div className="grid grid-cols-2 gap-3">
          <Button size="s" variant="tertiary" disabled={actionsDisabled || !canClaim} onClick={openClaimDialog}>
            Claim
          </Button>
          <Button size="s" variant="tertiary" disabled={actionsDisabled || farm.staked.eq(0)} onClick={openUnstakeDialog}>
            Withdraw
          </Button>
        </div>
      </div>

      <RewardAmount
        farm={farm}
        calculateReward={calculateReward}
        refreshGrowingRewardIntervalInMs={refreshGrowingRewardIntervalInMs}
      />

      <div className="mt-auto grid grid-cols-1 gap-5 border-neutral-700 border-t pt-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="typography-label-3 text-neutral-400">My Deposit</div>
          <div className="typography-heading-5 flex items-center gap-2 text-primary-inverse">
            <img src={getTokenImage(farm.stakingToken.symbol)} alt={farm.stakingToken.symbol} className="h-5 w-5" />
            <span>{farm.stakingToken.symbol}</span>
            <span>{farm.stakingToken.format(farm.staked, { style: 'auto' })}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="typography-label-3 text-neutral-400">APY</div>
          <div className="typography-heading-5 text-feature-farms-primary">{formatPercentage(farm.apy)}</div>
        </div>
      </div>
    </section>
  )
}

interface RewardAmountProps {
  farm: Farm
  calculateReward: (timestampInMs: number) => NormalizedUnitNumber
  refreshGrowingRewardIntervalInMs: number | undefined
}

function RewardAmount({ farm, calculateReward, refreshGrowingRewardIntervalInMs }: RewardAmountProps) {
  const { timestampInMs } = useTimestamp({ refreshIntervalInMs: refreshGrowingRewardIntervalInMs })
  const reward = calculateReward(timestampInMs)
  const precision = reward.lt(1) ? 9 : 4

  return (
    <div className="mt-8">
      <div className="flex items-baseline tabular-nums">
        <div className="typography-display-2 bg-gradient-farms-1 bg-clip-text text-transparent">
          {getWholePart(reward)}
        </div>
        <div className="typography-heading-3 text-feature-farms-primary">
          {getFractionalPart(reward, precision)}
        </div>
      </div>
      <div className="typography-label-2 mt-1 text-neutral-300">&#8776;{farm.rewardToken.formatUSD(reward)}</div>
    </div>
  )
}
