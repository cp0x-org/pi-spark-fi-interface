import { Farm } from '@/domain/farms/types'
import { TokenWithBalance } from '@/domain/common/types'
import { Token } from '@/domain/types/Token'
import { assets } from '@/ui/assets'
import { NetworkBadge } from '@/ui/atoms/network-badge/NetworkBadge'
import { ApyChart } from '@/ui/charts/apy-chart/ApyChart'
import { ChartTabsPanel, createChartTab } from '@/ui/charts/components/ChartTabsPanel'
import { TvlChart } from '@/ui/charts/tvl-chart/TvlChart'
import { PageLayout } from '@/ui/layouts/PageLayout'
import { CheckedAddress } from '@sparkdotfi/common-universal'
import { InfoIcon } from 'lucide-react'
import { SpkFarmCtaPanel } from '../components/SpkFarmCtaPanel'
import { SpkFarmTokensToDeposit } from '../components/SpkFarmTokensToDeposit'
import { SpkFarmChartDetails } from '../logic/useSpkFarm'

export interface SpkFarmViewProps {
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

export function SpkFarmView({
  chainId,
  chainMismatch,
  walletConnected,
  farm,
  tokensToDeposit,
  hasTokensToDeposit,
  chartDetails,
  getBlockExplorerAddressLink,
  openStakeDialog,
  openDefaultedStakeDialog,
  openConnectModal,
  openSandboxModal,
}: SpkFarmViewProps) {
  return (
    <PageLayout className="gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <img src={assets.token.spk} alt="SPK" className="h-10 w-10" />
          <h1 className="typography-heading-2 md:typography-heading-1">SPK Farm</h1>
          <NetworkBadge chainId={chainId} />
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-secondary shadow-xs">
          <span className="typography-label-3">Powered by:</span>
          <img src={assets.token.sky} alt="Sky" className="h-4 w-4" />
          <span className="typography-label-2 text-primary">Sky</span>
          <InfoIcon className="h-4 w-4 text-neutral-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SpkFarmCtaPanel
          farm={farm}
          walletConnected={walletConnected}
          chainMismatch={chainMismatch}
          hasTokensToDeposit={hasTokensToDeposit}
          openConnectModal={openConnectModal}
          openDepositDialog={openDefaultedStakeDialog}
          openSandboxModal={openSandboxModal}
        />

        <ChartTabsPanel
          height={300}
          tabs={[
            createChartTab({
              id: 'apy',
              label: 'APY',
              component: ApyChart,
              isError: chartDetails.farmHistory.isError,
              isPending: chartDetails.farmHistory.isLoading,
              props: {
                data: chartDetails.farmHistory.data ?? [],
                primaryColor: '#FA43BD',
                lineColorClassName: 'bg-gradient-spark-primary-2',
              },
              availableTimeframes: chartDetails.availableTimeframes,
              selectedTimeframe: chartDetails.timeframe,
              setSelectedTimeframe: chartDetails.onTimeframeChange,
            }),
            createChartTab({
              id: 'tvl',
              label: 'TVL',
              component: TvlChart,
              isError: chartDetails.farmHistory.isError,
              isPending: chartDetails.farmHistory.isLoading,
              props: {
                data: chartDetails.farmHistory.data ?? [],
                primaryColor: '#FA43BD',
                lineColorClassName: 'bg-gradient-spark-primary-2',
              },
              availableTimeframes: chartDetails.availableTimeframes,
              selectedTimeframe: chartDetails.timeframe,
              setSelectedTimeframe: chartDetails.onTimeframeChange,
            }),
          ]}
        />
      </div>

      <SpkFarmTokensToDeposit
        assets={tokensToDeposit}
        getBlockExplorerAddressLink={getBlockExplorerAddressLink}
        openStakeDialog={openStakeDialog}
      />
    </PageLayout>
  )
}
