import { spark2ApiUrl } from '@/config/consts'
import { normalizedUnitNumberSchema } from '@/domain/common/validation'
import { Timeframe } from '@/ui/charts/defaults'
import { useFilterChartDataByTimeframe } from '@/ui/charts/logic/useFilterDataByTimeframe'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { ChartDetails, SparkStakingHistoryItem } from '../types'

export const SpkStakingHistoryTimeframes = ['7D', '1M', '1Y', 'All'] as const satisfies Timeframe[]
export type SpkStakingHistoryTimeframes = (typeof SpkStakingHistoryTimeframes)[number]

export function useChartDetails(): ChartDetails {
  const [timeframe, setTimeframe] = useState<SpkStakingHistoryTimeframes>('All')
  const filterDataByTimeframe = useFilterChartDataByTimeframe(timeframe)

  const result = useQuery({
    queryKey: ['spk-staking', 'chart-details'],
    queryFn: async (): Promise<SparkStakingHistoryItem[]> => {
      const response = await fetch(`${spark2ApiUrl}/spk-staking/stats/historic/`)
      if (!response.ok) {
        throw new Error('Error fetching SPK staking historic stats')
      }
      const parsedResult = historicStatsResponseSchema.parse(await response.json())

      return parsedResult.map((item) => ({
        date: item.datetime,
        totalStaked: item.total_staked,
      }))
    },
    select: filterDataByTimeframe,
  })

  return {
    history: result,
    onTimeframeChange: (timeframe: Timeframe) => {
      if (SpkStakingHistoryTimeframes.includes(timeframe)) {
        setTimeframe(timeframe as any)
      }
    },
    timeframe,
    availableTimeframes: SpkStakingHistoryTimeframes,
  }
}

const historicStatsResponseSchema = z.array(
  z.object({
    datetime: z.string().transform((value) => new Date(value)),
    total_staked: normalizedUnitNumberSchema,
  }),
)
