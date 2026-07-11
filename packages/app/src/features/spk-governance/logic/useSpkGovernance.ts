import { testSpkStakingAbi, testSpkStakingAddress } from '@/config/contracts-generated'
import { paths } from '@/config/paths'
import { getContractAddress } from '@/domain/hooks/useContractAddress'
import { usePageChainId } from '@/domain/hooks/usePageChainId'
import { useTokenRepositoryForFeature } from '@/domain/token-repository/useTokenRepositoryForFeature'
import { Token } from '@/domain/types/Token'
import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { useOpenDialog } from '@/domain/state/dialogs'
import {
  type SpkGovernanceDelegateDialogOpenProps,
  spkGovernanceDelegateDialogConfig,
} from '@/features/spk-governance/dialogs/delegate/SpkGovernanceDelegateDialog'
import { BaseUnitNumber, CheckedAddress, NormalizedUnitNumber } from '@sparkdotfi/common-universal'
import { useSuspenseQueries } from '@tanstack/react-query'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Address, getAddress, isAddress, zeroAddress } from 'viem'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { type Config, useAccount, useChainId, useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { z } from 'zod'
import {
  SNAPSHOT_DELEGATE_REGISTRY_ADDRESS,
  SPARK_SNAPSHOT_SPACE,
  SPARK_SNAPSHOT_SPACE_ID,
  getWhitelistedGovernanceDelegate,
  isWhitelistedGovernanceDelegate,
  snapshotDelegateRegistryAbi,
  spkGovernanceQueryKeyPrefix,
} from './delegation'

const SNAPSHOT_GRAPHQL_URL = 'https://hub.snapshot.org/graphql'

export interface GovernanceProposal {
  title: string
  votes: NormalizedUnitNumber
  start: Date
  end: Date
  voteLink: string
}

export interface DelegateInfo {
  address: CheckedAddress
  name?: string
  whitelisted: boolean
}

export interface UseSpkGovernanceResult {
  chainId: number
  walletConnected: boolean
  chainMismatch: boolean
  selectedAccount: CheckedAddress | undefined
  isReadOnlyAccount: boolean
  proposals: GovernanceProposal[]
  spk: Token
  spkBalance: NormalizedUnitNumber
  slashableStakedSpk: NormalizedUnitNumber
  votingPower: NormalizedUnitNumber
  delegate: DelegateInfo | undefined
  openConnectWalletModal: () => void
  openDelegateAction: () => void
  openUndelegateAction: () => void
  openStakeAction: () => void
}

export function useSpkGovernance(): UseSpkGovernanceResult {
  const { chainId } = usePageChainId()
  const connectedChainId = useChainId()
  const wagmiConfig = useConfig()
  const { address: account } = useAccount()
  const viewAccount = useViewAccount()
  const readAccount = account ?? viewAccount
  const selectedAccount = readAccount ? CheckedAddress(readAccount) : undefined
  const walletConnected = account !== undefined
  const chainMismatch = walletConnected && connectedChainId !== chainId
  const { openConnectModal = () => {} } = useConnectModal()
  const openDialog = useOpenDialog()
  const navigate = useNavigate()

  const { tokenRepository } = useTokenRepositoryForFeature({
    chainId,
    featureGroup: 'sparkToken',
    account: readAccount,
  })
  const { token: spk, balance: spkBalance } = tokenRepository.findOneTokenWithBalanceBySymbol(TokenSymbol('SPK'))

  const [proposalsQuery, delegateQuery, slashableStakedSpkQuery, snapshotVotingPowerQuery] = useSuspenseQueries({
    queries: [
      {
        queryKey: [...spkGovernanceQueryKeyPrefix, 'active-proposals'],
        queryFn: fetchActiveProposals,
      },
      {
        queryKey: [...spkGovernanceQueryKeyPrefix, 'delegate', chainId, readAccount],
        queryFn: () => fetchDelegate({ account: readAccount, chainId, wagmiConfig }),
      },
      {
        queryKey: [...spkGovernanceQueryKeyPrefix, 'slashable-staked-spk', chainId, readAccount],
        queryFn: () => fetchSlashableStakedSpk({ account: readAccount, chainId, spk, wagmiConfig }),
      },
      {
        queryKey: [...spkGovernanceQueryKeyPrefix, 'snapshot-voting-power', readAccount],
        queryFn: () => fetchSnapshotVotingPower(readAccount),
      },
    ],
  })

  const delegate = decorateDelegate(delegateQuery.data)
  const slashableStakedSpk = slashableStakedSpkQuery.data
  const walletBackedVotingPower = NormalizedUnitNumber(spkBalance.plus(slashableStakedSpk))
  const isDelegatingToNotWhitelisted = !!delegate && !delegate.whitelisted
  const votingPower = isDelegatingToNotWhitelisted
    ? NormalizedUnitNumber(0)
    : snapshotVotingPowerQuery.data.gt(0)
      ? snapshotVotingPowerQuery.data
      : walletBackedVotingPower

  function openDelegateAction(): void {
    if (!walletConnected) {
      openConnectModal()
      return
    }

    openDialog<SpkGovernanceDelegateDialogOpenProps>(spkGovernanceDelegateDialogConfig, {
      action: 'delegate',
      chainId,
      currentDelegate: delegate?.address,
    })
  }

  function openUndelegateAction(): void {
    if (!walletConnected) {
      openConnectModal()
      return
    }

    openDialog<SpkGovernanceDelegateDialogOpenProps>(spkGovernanceDelegateDialogConfig, {
      action: 'undelegate',
      chainId,
      currentDelegate: delegate?.address,
    })
  }

  function openStakeAction(): void {
    if (!walletConnected) {
      openConnectModal()
      return
    }

    navigate(paths.spkStaking)
  }

  return {
    chainId,
    walletConnected,
    chainMismatch,
    selectedAccount,
    isReadOnlyAccount: !account && !!viewAccount,
    proposals: proposalsQuery.data,
    spk,
    spkBalance,
    slashableStakedSpk,
    votingPower,
    delegate,
    openConnectWalletModal: openConnectModal,
    openDelegateAction,
    openUndelegateAction,
    openStakeAction,
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

async function fetchActiveProposals(): Promise<GovernanceProposal[]> {
  const response = await fetch(SNAPSHOT_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query Proposals($where: ProposalWhere) {
          proposals(where: $where) {
            start
            end
            votes
            title
            link
          }
        }
      `,
      variables: {
        where: { space: SPARK_SNAPSHOT_SPACE, state: 'active' },
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch proposals')
  }

  return activeProposalsResponseSchema.parse(await response.json()).data.proposals
}

async function fetchSnapshotVotingPower(account: Address | undefined): Promise<NormalizedUnitNumber> {
  if (!account || !isWhitelistedGovernanceDelegate(account)) {
    return NormalizedUnitNumber(0)
  }

  const response = await fetch(SNAPSHOT_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query Vp($voter: String!, $space: String!) {
          vp(voter: $voter, space: $space) {
            vp
          }
        }
      `,
      variables: { voter: account, space: SPARK_SNAPSHOT_SPACE },
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch voting power')
  }

  return snapshotVotingPowerResponseSchema.parse(await response.json()).data.vp.vp
}

async function fetchDelegate({
  account,
  chainId,
  wagmiConfig,
}: {
  account: Address | undefined
  chainId: number
  wagmiConfig: Config
}): Promise<CheckedAddress | null> {
  if (!account) {
    return null
  }

  const delegate = await readContract(wagmiConfig, {
    address: SNAPSHOT_DELEGATE_REGISTRY_ADDRESS,
    abi: snapshotDelegateRegistryAbi,
    functionName: 'delegation',
    args: [account, SPARK_SNAPSHOT_SPACE_ID],
    chainId,
  })

  if (delegate === zeroAddress) {
    return null
  }

  return CheckedAddress(getAddress(delegate))
}

async function fetchSlashableStakedSpk({
  account,
  chainId,
  spk,
  wagmiConfig,
}: {
  account: Address | undefined
  chainId: number
  spk: Token
  wagmiConfig: Config
}): Promise<NormalizedUnitNumber> {
  if (!account) {
    return NormalizedUnitNumber(0)
  }

  const balance = await readContract(wagmiConfig, {
    address: getContractAddress(testSpkStakingAddress, chainId),
    abi: testSpkStakingAbi,
    functionName: 'slashableBalanceOf',
    args: [account],
    chainId,
  })

  return BaseUnitNumber.toNormalizedUnit(BaseUnitNumber(balance), spk.decimals)
}

function decorateDelegate(delegate: CheckedAddress | null): DelegateInfo | undefined {
  if (!delegate) {
    return undefined
  }

  const whitelistedDelegate = getWhitelistedGovernanceDelegate(delegate)

  return {
    address: delegate,
    name: whitelistedDelegate?.name,
    whitelisted: whitelistedDelegate !== undefined,
  }
}

const activeProposalsResponseSchema = z.object({
  data: z.object({
    proposals: z.array(
      z
        .object({
          start: z.number(),
          end: z.number(),
          votes: z.number(),
          title: z.string(),
          link: z.string(),
        })
        .transform((proposal) => ({
          title: proposal.title,
          votes: NormalizedUnitNumber(proposal.votes),
          start: new Date(proposal.start * 1000),
          end: new Date(proposal.end * 1000),
          voteLink: proposal.link,
        })),
    ),
  }),
})

const snapshotVotingPowerResponseSchema = z.object({
  data: z.object({
    vp: z.object({
      vp: z.number().transform(NormalizedUnitNumber),
    }),
  }),
})
