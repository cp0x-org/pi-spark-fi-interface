import { NormalizedUnitNumber, Percentage } from '@sparkdotfi/common-universal'
import { CheckedAddress } from '@sparkdotfi/common-universal'
import { queryOptions, skipToken } from '@tanstack/react-query'
import { z } from 'zod'

export interface FarmHistoricDataParameters {
  chainId: number
  farmAddress: CheckedAddress
  historyCutoff?: Date
  getFarmDetailsApiUrl: ((address: CheckedAddress) => string) | undefined
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function farmHistoricDataQueryOptions({
  chainId,
  farmAddress,
  historyCutoff,
  getFarmDetailsApiUrl,
}: FarmHistoricDataParameters) {
  return queryOptions({
    queryKey: ['farm-historic-data', chainId, farmAddress],
    queryFn: getFarmDetailsApiUrl
      ? async () => {
          const baseUrl = getFarmDetailsApiUrl(farmAddress)
          const data: FarmHistoricDataItem[] = []
          let page = 1
          let hasNextPage = true

          while (hasNextPage) {
            const res = await fetch(page === 1 ? baseUrl : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}p=${page}`)
            if (!res.ok) {
              throw new Error(`Failed to fetch farm data: ${res.statusText}`)
            }

            const pageData = historicDataResponseSchema.parse(await res.json())
            data.push(...pageData.results)
            hasNextPage = pageData.hasNextPage
            page += 1
          }

          if (historyCutoff) {
            return data.filter((result) => result.date >= historyCutoff)
          }

          return data
        }
      : skipToken,
  })
}

interface FarmHistoricDataItem {
  date: Date
  apy: Percentage
  tvl: NormalizedUnitNumber
}

const historicDataResponseSchema = z
  .object({
    next: z.string().nullable().optional(),
    results: z.array(
      z.object({
        date: z.string().transform((value) => new Date(value)),
        apr: z.string().transform((value) => Percentage(value, { allowMoreThan1: true })),
        total_staked: z.string().transform((value) => NormalizedUnitNumber(value)),
      }),
    ),
  })
  .transform((value) =>
    ({
      hasNextPage: !!value.next,
      results: value.results.map((result) => ({
        date: result.date,
        apy: result.apr,
        tvl: result.total_staked,
      })),
    }),
  )
