import { Token } from '@/domain/types/Token'
import { Address } from '@/ui/atoms/address/Address'
import { Button } from '@/ui/atoms/button/Button'
import { LinkButton } from '@/ui/atoms/link-button/LinkButton'
import { Panel } from '@/ui/atoms/panel/Panel'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/atoms/tooltip/Tooltip'
import { assets } from '@/ui/assets'
import { links } from '@/ui/constants/links'
import { PageLayout } from '@/ui/layouts/PageLayout'
import { DataTable, DataTableColumnDefinitions } from '@/ui/molecules/data-table/DataTable'
import { cn } from '@/ui/utils/style'
import { CheckedAddress, NormalizedUnitNumber } from '@sparkdotfi/common-universal'
import { AlertTriangleIcon, ExternalLinkIcon, FileTextIcon, InfoIcon, ZapIcon } from 'lucide-react'
import { useMemo } from 'react'
import { DelegateInfo, GovernanceProposal, UseSpkGovernanceResult } from '../logic/useSpkGovernance'

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })

export function SpkGovernanceView({
  walletConnected,
  chainMismatch,
  selectedAccount,
  isReadOnlyAccount,
  proposals,
  spk,
  spkBalance,
  slashableStakedSpk,
  votingPower,
  delegate,
  openConnectWalletModal,
  openDelegateAction,
  openUndelegateAction,
  openStakeAction,
}: UseSpkGovernanceResult) {
  const hasSelectedAccount = selectedAccount !== undefined
  const hasVotingPower = spkBalance.gt(0) || slashableStakedSpk.gt(0) || votingPower.gt(0)

  return (
    <PageLayout className="gap-5">
      <h1 className="typography-heading-1">Spark Governance</h1>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[11fr_5fr]">
        <div className="grid grid-cols-1 gap-5">
          {delegate ? (
            <VotingPowerDelegationPanel
              delegate={delegate}
              delegatedVotingPower={NormalizedUnitNumber(spkBalance.plus(slashableStakedSpk))}
              spk={spk}
              walletConnected={walletConnected}
              chainMismatch={chainMismatch}
              openDelegateAction={openDelegateAction}
              openUndelegateAction={openUndelegateAction}
            />
          ) : (
            <NoDelegationPanel
              selectedAccount={selectedAccount}
              isReadOnlyAccount={isReadOnlyAccount}
              walletConnected={walletConnected}
              chainMismatch={chainMismatch}
              openConnectWalletModal={openConnectWalletModal}
              openDelegateAction={openDelegateAction}
            />
          )}

          <ProposalsPanel proposals={proposals} />
        </div>

        {hasSelectedAccount && hasVotingPower ? (
          <MyVotingPowerPanel
            selectedAccount={selectedAccount}
            isReadOnlyAccount={isReadOnlyAccount}
            spk={spk}
            votingPower={votingPower}
            spkBalance={spkBalance}
            slashableStakedSpk={slashableStakedSpk}
            delegate={delegate}
            walletConnected={walletConnected}
            chainMismatch={chainMismatch}
            openDelegateAction={openDelegateAction}
            openStakeAction={openStakeAction}
          />
        ) : (
          <ParticipateInGovernancePanel />
        )}
      </div>
    </PageLayout>
  )
}

interface NoDelegationPanelProps {
  selectedAccount: CheckedAddress | undefined
  isReadOnlyAccount: boolean
  walletConnected: boolean
  chainMismatch: boolean
  openConnectWalletModal: () => void
  openDelegateAction: () => void
}

function NoDelegationPanel({
  selectedAccount,
  isReadOnlyAccount,
  walletConnected,
  chainMismatch,
  openConnectWalletModal,
  openDelegateAction,
}: NoDelegationPanelProps) {
  const hasAccount = selectedAccount !== undefined

  return (
    <Panel spacing="m" className="flex min-h-[258px] flex-col gap-9">
      <div className="my-auto flex flex-col items-center gap-5">
        <GovernanceBoostIcon />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="typography-heading-5 text-primary">
            {hasAccount ? (
              'Delegate & Boost your Points'
            ) : (
              <>
                Connect Wallet, Delegate
                <br className="sm:hidden" /> & Boost your Points
              </>
            )}
          </div>
          <div className="typography-body-3 max-w-[520px] text-secondary">
            {hasAccount
              ? 'Delegate your voting power and increase your Spark points earnings by 10%.'
              : 'Connect your wallet to delegate your voting power and increase your Spark points earnings by 10%.'}
          </div>
          {isReadOnlyAccount && selectedAccount && (
            <div className="typography-label-4 mt-1 rounded-full bg-secondary px-3 py-1 text-secondary">
              Viewing <Address address={selectedAccount} compact className="inline-flex" />
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="m"
          disabled={walletConnected && chainMismatch}
          onClick={hasAccount && walletConnected ? openDelegateAction : openConnectWalletModal}
        >
          {hasAccount && walletConnected ? 'Delegate now' : 'Connect Wallet'}
        </Button>
      </div>
    </Panel>
  )
}

function GovernanceBoostIcon() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <img src={assets.token.spk} alt="SPK" className="h-16 w-16" />
      <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-[#5823F3] text-white">
        <ZapIcon className="h-3.5 w-3.5 fill-current" />
      </div>
    </div>
  )
}

interface VotingPowerDelegationPanelProps {
  delegate: DelegateInfo
  delegatedVotingPower: NormalizedUnitNumber
  spk: Token
  walletConnected: boolean
  chainMismatch: boolean
  openDelegateAction: () => void
  openUndelegateAction: () => void
}

function VotingPowerDelegationPanel({
  delegate,
  delegatedVotingPower,
  spk,
  walletConnected,
  chainMismatch,
  openDelegateAction,
  openUndelegateAction,
}: VotingPowerDelegationPanelProps) {
  const rows = useMemo(
    () => [{ delegate, delegatedVotingPower, spk, openUndelegateAction }],
    [delegate, delegatedVotingPower, openUndelegateAction, spk],
  )

  const columns = useMemo<DataTableColumnDefinitions<(typeof rows)[number]>>(
    () => ({
      delegate: {
        header: 'Delegate',
        renderCell: ({ delegate }) => (
          <div className="flex min-w-0 items-center gap-2">
            <DelegateAvatar delegate={delegate} />
            {delegate.name && <div className="typography-label-2 text-primary">{delegate.name}</div>}
            <Address address={delegate.address} compact className="typography-label-2 min-w-0 text-secondary" />
          </div>
        ),
      },
      delegatedVotingPower: {
        header: 'Delegated voting power',
        headerAlign: 'right',
        renderCell: ({ delegatedVotingPower, spk, delegate }) => (
          <div className="flex items-center justify-end gap-1">
            <TokenAmount
              token={spk}
              amount={delegatedVotingPower}
              iconSrc={assets.brand.symbolGradient}
              className="text-primary"
            />
            {!delegate.whitelisted && <NotWhitelistedIcon />}
          </div>
        ),
      },
      action: {
        header: '',
        headerAlign: 'right',
        renderCell: ({ openUndelegateAction }) => (
          <div className="flex justify-end">
            <Button
              variant="tertiary"
              size="s"
              disabled={walletConnected && chainMismatch}
              onClick={openUndelegateAction}
              className="w-full sm:w-fit"
            >
              Undelegate
            </Button>
          </div>
        ),
      },
    }),
    [chainMismatch, walletConnected],
  )

  return (
    <Panel spacing="m" className="flex flex-col gap-9">
      <div className="flex flex-row items-center justify-between gap-3">
        <h5 className="typography-heading-6 sm:typography-heading-5 flex items-center gap-1">
          Voting power delegation
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="mt-1 h-4 w-4 text-secondary" />
            </TooltipTrigger>
            <TooltipContent>
              By delegating your voting power, you authorize the delegate to vote on Spark governance proposals with the
              power of your tokens on your behalf, while you retain full ownership of the tokens.
            </TooltipContent>
          </Tooltip>
        </h5>
        <Button
          variant="tertiary"
          size="s"
          disabled={walletConnected && chainMismatch}
          onClick={openDelegateAction}
          className="shrink-0"
        >
          Delegate
        </Button>
      </div>

      <div className="flex flex-col gap-5 sm:hidden">
        <div className="flex flex-col gap-2">
          <div className="typography-label-3 text-secondary">Delegate</div>
          <div className="flex min-w-0 items-center gap-2">
            <DelegateAvatar delegate={delegate} />
            {delegate.name && <div className="typography-label-2 text-primary">{delegate.name}</div>}
            <Address address={delegate.address} compact className="typography-label-2 min-w-0 text-secondary" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-primary border-t pt-4">
          <div className="typography-label-3 text-secondary">Delegated voting power</div>
          <div className="flex items-center gap-1">
            <TokenAmount
              token={spk}
              amount={delegatedVotingPower}
              iconSrc={assets.brand.symbolGradient}
              className="text-primary"
            />
            {!delegate.whitelisted && <NotWhitelistedIcon />}
          </div>
        </div>

        <div className="flex">
          <Button
            variant="tertiary"
            size="m"
            disabled={walletConnected && chainMismatch}
            onClick={openUndelegateAction}
            className="w-full"
          >
            Undelegate
          </Button>
        </div>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <DataTable gridTemplateColumnsClassName="grid-cols-[2fr_2fr_220px]" data={rows} columnDef={columns} />
      </div>
    </Panel>
  )
}

function DelegateAvatar({ delegate }: { delegate: DelegateInfo }) {
  return (
    <div
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium',
        delegate.whitelisted ? 'bg-gradient-spark-primary-1 text-primary-inverse' : 'bg-secondary text-secondary',
      )}
    >
      {delegate.name?.slice(0, 1) ?? '?'}
    </div>
  )
}

function NotWhitelistedIcon() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AlertTriangleIcon className="h-4 w-4 text-system-error-primary" />
      </TooltipTrigger>
      <TooltipContent>
        Delegate is not whitelisted. Under the current voting strategy, both your voting power and your delegate&apos;s
        will be counted as 0. No additional Spark Points will be rewarded.
      </TooltipContent>
    </Tooltip>
  )
}

function ProposalsPanel({ proposals }: { proposals: GovernanceProposal[] }) {
  if (proposals.length === 0) {
    return <NoActiveProposalsPanel />
  }

  return <ActiveProposalsPanel proposals={proposals} />
}

function ActiveProposalsPanel({ proposals }: { proposals: GovernanceProposal[] }) {
  const columns = useMemo<DataTableColumnDefinitions<GovernanceProposal>>(
    () => ({
      title: {
        header: 'Title',
        renderCell: ({ title }) => (
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-secondary p-2">
              <FileTextIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="typography-label-3 text-primary">{title}</div>
          </div>
        ),
      },
      votes: {
        header: 'Votes',
        headerAlign: 'right',
        renderCell: ({ votes }) => <div className="typography-label-3 text-right">{formatCompact(votes)}</div>,
      },
      start: {
        header: 'Start date',
        headerAlign: 'right',
        renderCell: ({ start }) => <div className="typography-label-3 text-right">{dateFormatter.format(start)}</div>,
      },
      end: {
        header: 'End date',
        headerAlign: 'right',
        renderCell: ({ end }) => <div className="typography-label-3 text-right">{dateFormatter.format(end)}</div>,
      },
      action: {
        header: 'Action',
        headerAlign: 'right',
        renderCell: ({ voteLink }) => (
          <div className="flex justify-end sm:pl-10">
            <LinkButton to={voteLink} external variant="secondary" size="s" className="w-full">
              Vote <ExternalLinkIcon className="h-3.5 w-3.5" />
            </LinkButton>
          </div>
        ),
      },
    }),
    [],
  )

  return (
    <Panel spacing="m" className="flex flex-col gap-9">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="typography-heading-6 sm:typography-heading-5 flex items-center gap-2">
          Active proposals
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D9B1] opacity-20" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-[#00D9B1]/70" />
          </span>
        </div>
        <LinkButton to={links.snapshot.proposals} external variant="tertiary" size="s">
          View on Snapshot <ExternalLinkIcon className="h-3.5 w-3.5" />
        </LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {proposals.map((proposal) => (
          <div key={proposal.voteLink} className="flex flex-col gap-4 border-primary border-t pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-secondary p-2">
                <FileTextIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="typography-label-2 text-primary">{proposal.title}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ProposalMobileMetric label="Votes" value={formatCompact(proposal.votes)} />
              <ProposalMobileMetric label="Start date" value={dateFormatter.format(proposal.start)} />
              <ProposalMobileMetric label="End date" value={dateFormatter.format(proposal.end)} />
            </div>
            <LinkButton to={proposal.voteLink} external variant="secondary" size="s" className="w-full">
              Vote <ExternalLinkIcon className="h-3.5 w-3.5" />
            </LinkButton>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <div className="min-w-[760px]">
          <DataTable
            gridTemplateColumnsClassName="grid-cols-[4fr_1fr_1fr_1fr_140px]"
            data={proposals}
            columnDef={columns}
          />
        </div>
      </div>
    </Panel>
  )
}

function ProposalMobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="typography-label-4 text-secondary">{label}</div>
      <div className="typography-label-3 text-primary">{value}</div>
    </div>
  )
}

function NoActiveProposalsPanel() {
  return (
    <Panel spacing="m" className="flex min-h-[258px] flex-col gap-9">
      <div className="my-auto flex flex-col items-center gap-5">
        <div className="rounded-full bg-secondary p-3">
          <FileTextIcon className="h-7 w-7 text-primary" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="typography-heading-5 text-primary">
            Currently, there are no <span className="whitespace-nowrap">active proposals</span>
          </div>
          <div className="typography-body-3 text-secondary">
            Follow Spark on Snapshot to keep up to date{' '}
            <span className="whitespace-nowrap">with new proposals.</span>
          </div>
        </div>

        <LinkButton to={links.snapshot.sparkSpace} external variant="tertiary" size="m">
          Follow on Snapshot <ExternalLinkIcon className="h-4 w-4" />
        </LinkButton>
      </div>
    </Panel>
  )
}

interface MyVotingPowerPanelProps {
  selectedAccount: CheckedAddress
  isReadOnlyAccount: boolean
  spk: Token
  votingPower: NormalizedUnitNumber
  spkBalance: NormalizedUnitNumber
  slashableStakedSpk: NormalizedUnitNumber
  delegate: DelegateInfo | undefined
  walletConnected: boolean
  chainMismatch: boolean
  openDelegateAction: () => void
  openStakeAction: () => void
}

function MyVotingPowerPanel({
  selectedAccount,
  isReadOnlyAccount,
  spk,
  votingPower,
  spkBalance,
  slashableStakedSpk,
  delegate,
  walletConnected,
  chainMismatch,
  openDelegateAction,
  openStakeAction,
}: MyVotingPowerPanelProps) {
  const isDelegating = delegate?.whitelisted === true
  const primaryAction = isDelegating ? openStakeAction : openDelegateAction
  const primaryActionLabel = isDelegating ? 'Stake SPK' : walletConnected ? 'Delegate' : 'Connect Wallet'

  return (
    <Panel variant="secondary" spacing="none" className="overflow-hidden p-6">
      <div className="-mx-6 -mt-6 flex min-h-[164px] flex-col items-center justify-center gap-3 bg-fg-primary px-6 py-12 text-center md:min-h-[174px]">
        <div className="flex items-center gap-1">
          <div className="typography-label-2 text-tertiary">{isDelegating ? 'Delegated' : 'My'} voting power</div>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-secondary" />
            </TooltipTrigger>
            <TooltipContent>
              Voting power is calculated based on the number of SPK tokens you hold and/or stake. By delegating your
              voting power, you authorize the delegate to vote on Spark governance proposals with the power of your tokens
              on your behalf, while you retain full ownership of the tokens.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <img src={assets.brand.symbolGradient} alt="voting-power-icon" className="h-9 w-9" />
          <div className="typography-heading-2">{spk.format(votingPower, { style: 'compact' })}</div>
        </div>
        {isReadOnlyAccount && (
          <div className="typography-label-4 flex items-center justify-center gap-1 text-tertiary">
            Viewing <Address address={selectedAccount} compact />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-6 pb-5">
        <VotingPowerRow label="Staked" token={spk} amount={slashableStakedSpk} />
        <VotingPowerRow label="Owned" token={spk} amount={spkBalance} />
      </div>

      <div className="typography-body-3 border-primary border-t pt-4 pb-5 text-tertiary">
        Participate in Spark Governance by delegating your voting power, or voting directly on proposals.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LinkButton to={links.docs.governance} external variant="secondary" size="l">
          Learn more <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
        </LinkButton>
        <Button variant="primary" size="l" disabled={walletConnected && chainMismatch} onClick={primaryAction}>
          {primaryActionLabel}
        </Button>
      </div>
    </Panel>
  )
}

function VotingPowerRow({ token, amount, label }: { token: Token; amount: NormalizedUnitNumber; label: string }) {
  return (
    <div className="typography-label-2 flex items-center justify-between gap-4">
      <div className="text-tertiary">{label}</div>
      <TokenAmount token={token} amount={amount} iconSrc={assets.token.spk} className="text-primary-inverse" />
    </div>
  )
}

function TokenAmount({
  token,
  amount,
  iconSrc,
  className,
}: {
  token: Token
  amount: NormalizedUnitNumber
  iconSrc: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img src={iconSrc} alt={token.symbol} className="h-3.5 w-3.5" />
      <div className="typography-label-2 whitespace-nowrap">
        {token.format(amount, { style: 'compact' })} {token.symbol}
      </div>
    </div>
  )
}

function ParticipateInGovernancePanel() {
  return (
    <Panel variant="secondary" spacing="none" className="relative isolate flex h-fit min-h-[420px] flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[58%] overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,217,177,0.18)_0%,rgba(0,217,177,0)_42%),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100%_100%,44px_44px,44px_44px]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00D9B1]/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={assets.brand.symbolGradient} alt="Spark" className="h-24 w-24" />
        </div>
      </div>

      <div className="relative mt-auto flex flex-col gap-8 p-6 pt-[62%] text-center">
        <div className="flex flex-col gap-4">
          <div className="typography-heading-3 text-white">Participate in Spark Governance</div>
          <div className="typography-body-3 text-tertiary tracking-normal">
            Participate in Spark Governance by voting on proposals or delegating your voting power and shape the future
            of Spark!
          </div>
        </div>

        <LinkButton to={links.docs.governance} external variant="secondary" size="l" className="w-full">
          Learn more <ExternalLinkIcon className="h-4 w-4" />
        </LinkButton>
      </div>
    </Panel>
  )
}

function formatCompact(value: NormalizedUnitNumber): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value.toNumber())
}
