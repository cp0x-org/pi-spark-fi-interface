import { assets } from '@/ui/assets'
import { Button } from '@/ui/atoms/button/Button'
import { Link } from '@/ui/atoms/link/Link'
import { Panel } from '@/ui/atoms/panel/Panel'
import { links } from '@/ui/constants/links'
import { cn } from '@/ui/utils/style'
import { NormalizedUnitNumber } from '@sparkdotfi/common-universal'

type StakeSpkActionProps =
  | {
      type: 'connected'
      spkBalance: NormalizedUnitNumber
      stake: () => void
    }
  | {
      type: 'disconnected'
      connectWallet: () => void
      tryInSandbox: () => void
    }

export type StakeSpkCTAPanelProps = {
  stakingMultiplier: NormalizedUnitNumber
  className?: string
} & StakeSpkActionProps

export function StakeSpkCTAPanel({ stakingMultiplier, className, ...actionsProps }: StakeSpkCTAPanelProps) {
  return (
    <Panel
      spacing="m"
      className={cn(
        'flex flex-col justify-between gap-4',
        'bg-cover bg-right bg-no-repeat',
        'bg-[url(/src/ui/assets/spark-staking/stake-cta-panel-bg.svg)] bg-primary-inverse',
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="typography-heading-3 sm:typography-heading-2 text-primary-inverse">
          Stake SPK and earn
          <br />
          <span className="inline-flex items-center gap-2">
            <img src={assets.sparkIcon} className="size-6 sm:size-10" />
            <span className="bg-clip-text text-transparent bg-gradient-spark-primary-2">Spark Points</span>
          </span>
        </div>
        <div className="typography-body-3 max-w-[48ch] text-tertiary">
          Stake SPK Token and start earning Spark&nbsp;Points.
          <br />
          Withdrawal delay between 2 and 4 weeks.
          <br />
          Staking may involve some risks. Please read more{' '}
          <Link to={links.docs.spkStaking} className="inline-flex items-center gap-1" external>
            here
          </Link>
          .
        </div>
      </div>
      <div className="typography-body-3 text-tertiary sm:mt-12">
        Multiplier:{' '}
        <span className="typography-heading-2 text-primary-inverse">{formatMultiplier(stakingMultiplier)}</span>
        <span className="typography-heading-2 bg-gradient-spark-primary-2 bg-clip-text text-transparent">x</span>
      </div>
      <Actions {...actionsProps} />
    </Panel>
  )
}

function formatMultiplier(multiplier: NormalizedUnitNumber): string {
  return Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(multiplier.toNumber())
}

function Actions(props: StakeSpkActionProps) {
  if (props.type === 'connected') {
    return (
      <Button variant="primary" size="l" className="w-full" onClick={props.stake} disabled={props.spkBalance.isZero()}>
        Stake
      </Button>
    )
  }

  if (props.type === 'disconnected') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Button variant="primary" size="l" onClick={props.connectWallet}>
          Connect Wallet
        </Button>
        <Button variant="secondary" size="l" onClick={props.tryInSandbox}>
          Try in Sandbox
        </Button>
      </div>
    )
  }
}
