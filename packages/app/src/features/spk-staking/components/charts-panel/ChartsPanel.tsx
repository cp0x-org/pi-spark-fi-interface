import { ChartTabsPanel, createChartTab } from '@/ui/charts/components/ChartTabsPanel'
import { TvlChart } from '@/ui/charts/tvl-chart/TvlChart'
import { cn } from '@/ui/utils/style'
import { NormalizedUnitNumber } from '@sparkdotfi/common-universal'
import { ChartDetails } from '../../types'

export interface ChartsPanelProps {
  chartDetails: ChartDetails
}

export function ChartsPanel({ chartDetails }: ChartsPanelProps) {
  return (
    <ChartTabsPanel
      tabs={[
        createChartTab({
          id: 'total-staked',
          label: 'Total Staked',
          component: TvlChart,
          isError: chartDetails.history.isError,
          isPending: chartDetails.history.isLoading,
          props: {
            data: (chartDetails.history.data ?? []).map((item) => ({
              date: item.date,
              tvl: item.totalStaked,
            })),
            primaryColor: '#FB4AB9',
            lineColorClassName: cn('bg-gradient-spark-primary-2'),
            valueLabel: 'Total Staked',
            formatTick: formatCompactTick,
            formatTooltipValue: formatTokenAmount,
          },
          availableTimeframes: chartDetails.availableTimeframes,
          selectedTimeframe: chartDetails.timeframe,
          setSelectedTimeframe: chartDetails.onTimeframeChange,
        }),
      ]}
    />
  )
}

function formatCompactTick(value: { valueOf(): number }): string {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value.valueOf())
}

function formatTokenAmount(value: NormalizedUnitNumber): string {
  return `${Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value.toNumber())} SPK`
}
