import { spark2ApiUrl, sparkDataApiUrl } from '@/config/consts'
import {
  testSpkStakingAbi,
  testSpkStakingAddress,
  testStakingRewardsAbi,
  testStakingRewardsAddress,
} from '@/config/contracts-generated'
import { hexSchema, normalizedUnitNumberSchema, percentageSchema } from '@/domain/common/validation'
import { getContractAddress } from '@/domain/hooks/useContractAddress'
import { TokenRepository } from '@/domain/token-repository/TokenRepository'
import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { SuspenseQueryWith } from '@/utils/types'
import {
  BaseUnitNumber,
  CheckedAddress,
  Hex,
  NormalizedUnitNumber,
  Percentage,
  UnixTime,
} from '@sparkdotfi/common-universal'
import { QueryKey, queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { range } from 'remeda'
import { Address } from 'viem'
import { Config } from 'wagmi'
import { getBlock, readContract } from 'wagmi/actions'
import { z } from 'zod'
import { GeneralStats } from '../types'

export interface SpkStakingDataQueryParams {
  chainId: number
  account: CheckedAddress | undefined
  wagmiConfig: Config
  tokenRepository: TokenRepository
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function spkStakingDataQueryOptions({
  chainId,
  account,
  wagmiConfig,
  tokenRepository,
}: SpkStakingDataQueryParams) {
  return queryOptions({
    queryKey: spkStakingDataQueryKey({ account, chainId }),
    queryFn: async () => {
      const spk = tokenRepository.findOneTokenBySymbol(TokenSymbol('SPK'))
      const usds = tokenRepository.findOneTokenBySymbol(TokenSymbol('USDS'))

      async function fetchAmountStaked(): Promise<NormalizedUnitNumber> {
        if (!account) {
          return Promise.resolve(NormalizedUnitNumber(0))
        }
        const balance = await readContract(wagmiConfig, {
          address: getContractAddress(testSpkStakingAddress, chainId),
          abi: testSpkStakingAbi,
          functionName: 'activeSharesOf',
          args: [account],
          chainId,
        })

        return BaseUnitNumber.toNormalizedUnit(BaseUnitNumber(balance), spk.decimals)
      }

      async function fetchPreclaimedRewards(): Promise<NormalizedUnitNumber> {
        if (!account) {
          return Promise.resolve(NormalizedUnitNumber(0))
        }
        const balance = await readContract(wagmiConfig, {
          address: getContractAddress(testStakingRewardsAddress, chainId),
          abi: testStakingRewardsAbi,
          functionName: 'cumulativeClaimed',
          args: [account, usds.address, 1n],
          chainId,
        })

        return BaseUnitNumber.toNormalizedUnit(BaseUnitNumber(balance), usds.decimals)
      }

      async function fetchWalletRewardsData(): Promise<z.infer<typeof baDataResponseSchema> & { merkle_root: Hex }> {
        if (!account) {
          return {
            amount_staked: NormalizedUnitNumber(0),
            pending_amount_normalized: NormalizedUnitNumber(0),
            pending_amount_rate: NormalizedUnitNumber(0),
            cumulative_amount_normalized: NormalizedUnitNumber(0),
            timestamp: 0,
            epoch: 0,
            proof: [],
            merkle_root: Hex.random(),
          }
        }

        const merkleRoot = await readContract(wagmiConfig, {
          address: getContractAddress(testStakingRewardsAddress, chainId),
          abi: testStakingRewardsAbi,
          functionName: 'merkleRoot',
          chainId,
        })

        const res = await fetch(`${spark2ApiUrl}/spk-staking/${account}/?season=${SPARK_POINTS_SEASON}`)
        if (!res.ok) {
          throw new Error('Failed to fetch rewards')
        }

        return {
          ...baDataResponseSchema.parse(await res.json()),
          merkle_root: Hex(merkleRoot),
        }
      }

      async function fetchVaultData(): Promise<VaultData> {
        const [currentEpoch, epochDuration, epochDurationInit] = await Promise.all([
          readContract(wagmiConfig, {
            address: getContractAddress(testSpkStakingAddress, chainId),
            abi: testSpkStakingAbi,
            functionName: 'currentEpoch',
            chainId,
          }),
          readContract(wagmiConfig, {
            address: getContractAddress(testSpkStakingAddress, chainId),
            abi: testSpkStakingAbi,
            functionName: 'epochDuration',
            chainId,
          }),
          readContract(wagmiConfig, {
            address: getContractAddress(testSpkStakingAddress, chainId),
            abi: testSpkStakingAbi,
            functionName: 'epochDurationInit',
            chainId,
          }),
        ])

        const nextEpochEnd = UnixTime(Number(currentEpoch + 2n) * epochDuration + epochDurationInit)

        if (!account) {
          return {
            nextEpochEnd,
            withdrawals: [],
          }
        }

        const withdrawals = await Promise.all(
          range(Math.max(0, Number(currentEpoch) - 25), Number(currentEpoch) + 1).map(async (i) => {
            const epoch = BigInt(i) + 1n

            const [amount, isWithdrawalsClaimed] = await Promise.all([
              readContract(wagmiConfig, {
                address: getContractAddress(testSpkStakingAddress, chainId),
                abi: testSpkStakingAbi,
                functionName: 'withdrawalSharesOf',
                args: [epoch, account],
                chainId,
              }),
              readContract(wagmiConfig, {
                address: getContractAddress(testSpkStakingAddress, chainId),
                abi: testSpkStakingAbi,
                functionName: 'isWithdrawalsClaimed',
                args: [epoch, account],
                chainId,
              }),
            ])

            return {
              epoch,
              amount: BaseUnitNumber.toNormalizedUnit(BaseUnitNumber(amount), spk.decimals),
              isWithdrawalsClaimed,
            }
          }),
        )

        const pendingWithdrawals = withdrawals.filter((w) => w.epoch >= currentEpoch)

        const formattedPendingWithdrawals = pendingWithdrawals.map((w) => ({
          epochs: [w.epoch],
          amount: w.amount,
          claimableAt: new Date(
            UnixTime.toMilliseconds(UnixTime(Number(w.epoch + 1n) * epochDuration + epochDurationInit)),
          ),
        }))

        const aggregatedPreviousWithdrawals = {
          ...withdrawals
            .filter((w) => w.epoch < currentEpoch)
            .filter((w) => w.amount.gt(0))
            .filter((w) => !w.isWithdrawalsClaimed)
            .reduce(
              (acc, curr) => ({
                epochs: [...acc.epochs, curr.epoch],
                amount: NormalizedUnitNumber(acc.amount.plus(curr.amount)),
              }),
              { epochs: [] as bigint[], amount: NormalizedUnitNumber(0) },
            ),
          claimableAt: new Date(
            UnixTime.toMilliseconds(UnixTime(Number(currentEpoch) * epochDuration + epochDurationInit)),
          ),
        }

        return {
          nextEpochEnd,
          withdrawals: [...formattedPendingWithdrawals, aggregatedPreviousWithdrawals].filter(
            (w) => !w.amount.isZero(),
          ),
        }
      }

      async function fetchTimestamp(): Promise<UnixTime> {
        const { timestamp } = await getBlock(wagmiConfig, {
          chainId,
        })

        return UnixTime(timestamp)
      }

      async function fetchGeneralStats(): Promise<GeneralStats> {
        const response = await fetch(`${spark2ApiUrl}/spk-staking/stats/`)
        if (!response.ok) {
          throw new Error('Error fetching SPK staking stats')
        }
        const result = await response.json()
        const parsedResult = generalStatsResponseSchema.parse(result)

        return {
          tvl: parsedResult.tvl,
          totalStaked: parsedResult.totalStaked,
          stakers: parsedResult.stakers,
          apr: parsedResult.apr,
        }
      }

      async function fetchStakingMultiplier(): Promise<NormalizedUnitNumber> {
        try {
          const response = await fetch(`${sparkDataApiUrl}/points/actions/?season=${SPARK_POINTS_SEASON}`)
          if (!response.ok) {
            return DEFAULT_STAKING_MULTIPLIER
          }
          const result = pointsActionsResponseSchema.parse(await response.json())
          const stakingAction = result.data.find((action) => action.action_key === 'staking')

          return stakingAction?.amount ?? DEFAULT_STAKING_MULTIPLIER
        } catch {
          return DEFAULT_STAKING_MULTIPLIER
        }
      }

      const [
        amountStaked,
        preclaimedRewards,
        walletRewardsData,
        { withdrawals, nextEpochEnd },
        timestamp,
        generalStats,
        stakingMultiplier,
      ] = await Promise.all([
        fetchAmountStaked(),
        fetchPreclaimedRewards(),
        fetchWalletRewardsData(),
        fetchVaultData(),
        fetchTimestamp(),
        fetchGeneralStats(),
        fetchStakingMultiplier(),
      ])

      const pendingAmountRaw = walletRewardsData.pending_amount_normalized.minus(preclaimedRewards)
      const pendingAmount = NormalizedUnitNumber(pendingAmountRaw.isNegative() ? 0 : pendingAmountRaw)
      const rewardsClaimableAmountRaw = walletRewardsData.cumulative_amount_normalized.minus(preclaimedRewards)
      const rewardsClaimableAmount = NormalizedUnitNumber(
        rewardsClaimableAmountRaw.isNegative() ? 0 : rewardsClaimableAmountRaw,
      )

      return {
        amountStaked,
        pendingAmount,
        pendingAmountRate: walletRewardsData.pending_amount_rate,
        pendingAmountTimestamp: walletRewardsData.timestamp,
        withdrawals,
        generalStats,
        stakingMultiplier,
        timestamp,
        nextEpochEnd,
        rewardsEpoch: walletRewardsData.epoch,
        rewardsProof: walletRewardsData.proof,
        rewardsRoot: walletRewardsData.merkle_root,
        rewardsCumulativeAmount: walletRewardsData.cumulative_amount_normalized,
        rewardsClaimableAmount,
        isOutOfSync: !amountStaked.eq(walletRewardsData.amount_staked),
      }
    },
    refetchInterval: (query) => {
      if (query.state.data?.isOutOfSync) {
        return 2_000
      }

      return undefined
    },
  })
}

export interface SpkStakingDataQueryKeyParams {
  account: Address | undefined
  chainId: number
}

export function spkStakingDataQueryKey({ account, chainId }: SpkStakingDataQueryKeyParams): QueryKey {
  return ['spk-staking', 'spkStakingData', chainId, account]
}

// @note: supports two response shapes:
// - the current spark2-api season response: slashable_balance_normalized, points_normalized,
//   points_per_second_normalized, timestamp_updated (no merkle claim data)
// - the legacy shape (still served by sandbox mocks): amount_staked, pending_amount_normalized,
//   pending_amount_rate, cumulative_amount_normalized, timestamp, epoch, proof
const baDataResponseSchema = z
  .object({
    slashable_balance_normalized: normalizedUnitNumberSchema.optional(),
    points_normalized: normalizedUnitNumberSchema.optional(),
    points_per_second_normalized: normalizedUnitNumberSchema.optional(),
    timestamp_updated: z.number().optional(),
    amount_staked: normalizedUnitNumberSchema.optional(),
    pending_amount_normalized: normalizedUnitNumberSchema.optional(),
    pending_amount_rate: normalizedUnitNumberSchema.optional(),
    cumulative_amount_normalized: normalizedUnitNumberSchema.optional(),
    timestamp: z.number().optional(),
    epoch: z.number().optional(),
    proof: z.array(hexSchema).optional(),
  })
  .transform((o) => ({
    amount_staked: o.amount_staked ?? o.slashable_balance_normalized ?? NormalizedUnitNumber(0),
    pending_amount_normalized: o.pending_amount_normalized ?? o.points_normalized ?? NormalizedUnitNumber(0),
    pending_amount_rate: o.pending_amount_rate ?? o.points_per_second_normalized ?? NormalizedUnitNumber(0),
    cumulative_amount_normalized: o.cumulative_amount_normalized ?? NormalizedUnitNumber(0),
    timestamp: o.timestamp ?? o.timestamp_updated ?? 0,
    epoch: o.epoch ?? 0,
    proof: o.proof ?? [],
  }))

const generalStatsResponseSchema = z
  .object({
    tvl: normalizedUnitNumberSchema,
    total_staked: normalizedUnitNumberSchema.optional(),
    number_of_wallets: z.number(),
    // @note: spark2-api stats endpoint does not always return apr
    apr: percentageSchema.optional(),
  })
  .transform((o) => ({
    tvl: o.tvl,
    totalStaked: o.total_staked ?? NormalizedUnitNumber(0),
    stakers: o.number_of_wallets,
    apr: o.apr ?? Percentage(0),
  }))

export const SPARK_POINTS_SEASON = 4
const DEFAULT_STAKING_MULTIPLIER = NormalizedUnitNumber(3)

const pointsActionsResponseSchema = z.object({
  data: z.array(
    z.object({
      action_key: z.string(),
      amount: normalizedUnitNumberSchema,
      rate_unit: z.string(),
    }),
  ),
})

export interface Withdrawal {
  epochs: bigint[]
  amount: NormalizedUnitNumber
  claimableAt: Date
}

export interface VaultData {
  nextEpochEnd: UnixTime
  withdrawals: Withdrawal[]
}

export interface SpkStakingData {
  amountStaked: NormalizedUnitNumber
  pendingAmount: NormalizedUnitNumber
  pendingAmountRate: NormalizedUnitNumber
  pendingAmountTimestamp: number
  generalStats: GeneralStats
  stakingMultiplier: NormalizedUnitNumber
  withdrawals: Withdrawal[]
  timestamp: UnixTime
  nextEpochEnd: UnixTime
  rewardsEpoch: number
  rewardsProof: Hex[]
  rewardsRoot: Hex
  rewardsCumulativeAmount: NormalizedUnitNumber
  rewardsClaimableAmount: NormalizedUnitNumber
  isOutOfSync: boolean
}

export type UseSpkStakingDataResultOnSuccess = SuspenseQueryWith<{
  spkStakingData: SpkStakingData
}>

export function useSpkStakingData({
  chainId,
  account,
  wagmiConfig,
  tokenRepository,
}: SpkStakingDataQueryParams): UseSpkStakingDataResultOnSuccess {
  const res = useSuspenseQuery(spkStakingDataQueryOptions({ chainId, account, wagmiConfig, tokenRepository }))

  return {
    ...res,
    spkStakingData: res.data,
  }
}
