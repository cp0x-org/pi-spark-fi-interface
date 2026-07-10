import { formatPercentage } from '@/domain/common/format'
import { Farm } from '@/domain/farms/types'
import { Token } from '@/domain/types/Token'
import { getTokenImage } from '@/ui/assets'
import { Button } from '@/ui/atoms/button/Button'
import { Link } from '@/ui/atoms/link/Link'
import { cn } from '@/ui/utils/style'

const SPK_FARM_DOCS_LINK = 'https://docs.spark.fi/governance/spk-token#sky-farming-users'

export interface SpkFarmCtaPanelProps {
  farm: Farm
  walletConnected: boolean
  chainMismatch: boolean
  hasTokensToDeposit: boolean
  openConnectModal: () => void
  openDepositDialog: () => void
  openSandboxModal: () => void
}

export function SpkFarmCtaPanel({
  farm,
  walletConnected,
  chainMismatch,
  hasTokensToDeposit,
  openConnectModal,
  openDepositDialog,
  openSandboxModal,
}: SpkFarmCtaPanelProps) {
  const depositDisabled = walletConnected && (!hasTokensToDeposit || chainMismatch)
  const apy = formatPercentage(farm.apy)

  return (
    <section
      className={cn(
        'relative isolate flex min-h-[414px] flex-col overflow-hidden rounded-sm bg-farm-cta-panel bg-cover',
        'px-6 py-8 text-primary-inverse sm:px-8 md:px-10 md:py-10',
      )}
    >
      <div className="max-w-[520px]">
        <h2 className="typography-heading-2 md:typography-heading-1">
          Deposit <TokenPill token={farm.stakingToken} variant="deposit" />
          <br />
          Earn rewards in <TokenPill token={farm.rewardToken} variant="reward" />
        </h2>

        <p className="typography-body-3 mt-5 max-w-[440px] text-neutral-300">
          Deposit USDS and start farming SPK. Withdraw at any time.
          <br />
          <Link to={SPK_FARM_DOCS_LINK} external className="whitespace-nowrap text-feature-farms-primary">
            Learn more
          </Link>
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-7">
        <div className="flex items-end gap-1">
          <div className="typography-label-2 mb-1 text-neutral-300">APY:</div>
          <div className="typography-heading-1">
            {apy.endsWith('%') ? apy.slice(0, -1) : apy}
            {apy.endsWith('%') && <span className="text-feature-farms-primary">%</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Button
            size="l"
            disabled={depositDisabled}
            onClick={walletConnected ? openDepositDialog : openConnectModal}
            className="w-full"
          >
            {walletConnected ? 'Deposit' : 'Connect Wallet'}
          </Button>
          <Button size="l" variant="secondary" onClick={openSandboxModal} className="w-full bg-neutral-900">
            Try in Sandbox
          </Button>
        </div>
      </div>
    </section>
  )
}

interface TokenPillProps {
  token: Token
  variant: 'deposit' | 'reward'
}

function TokenPill({ token, variant }: TokenPillProps) {
  return (
    <span
      className={cn(
        'inline-flex translate-y-1 items-center gap-2 rounded-full px-2.5 py-1 align-baseline',
        variant === 'deposit' ? 'bg-[#3A241E] text-[#FFA930]' : 'bg-[#3C2035] text-[#FF7DBB]',
      )}
    >
      <img src={getTokenImage(token.symbol)} alt={token.symbol} className="h-7 w-7" />
      {token.symbol}
    </span>
  )
}
