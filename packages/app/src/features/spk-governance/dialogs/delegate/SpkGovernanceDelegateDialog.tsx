import { useWrite, WriteStatus } from '@/domain/hooks/useWrite'
import { CommonDialogProps, DialogConfig } from '@/features/dialogs/common/types'
import { Address } from '@/ui/atoms/address/Address'
import { Button } from '@/ui/atoms/button/Button'
import { Dialog, DialogContent, DialogTitle } from '@/ui/atoms/dialog/Dialog'
import { Panel } from '@/ui/atoms/panel/Panel'
import { cn } from '@/ui/utils/style'
import { CheckedAddress } from '@sparkdotfi/common-universal'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2Icon } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  governanceDelegateOptions,
  GovernanceDelegateOption,
  SNAPSHOT_DELEGATE_REGISTRY_ADDRESS,
  snapshotDelegateRegistryAbi,
  SPARK_SNAPSHOT_SPACE_ID,
  spkGovernanceQueryKeyPrefix,
} from '../../logic/delegation'

export interface SpkGovernanceDelegateDialogOpenProps {
  action: 'delegate' | 'undelegate'
  chainId: number
  currentDelegate?: CheckedAddress
}

export interface SpkGovernanceDelegateDialogProps
  extends CommonDialogProps,
    SpkGovernanceDelegateDialogOpenProps {}

function SpkGovernanceDelegateDialog({
  open,
  setOpen,
  action,
  chainId,
  currentDelegate,
}: SpkGovernanceDelegateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent preventAutoFocus>
        <SpkGovernanceDelegateDialogContent
          action={action}
          chainId={chainId}
          currentDelegate={currentDelegate}
          closeDialog={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export const spkGovernanceDelegateDialogConfig: DialogConfig<SpkGovernanceDelegateDialogProps> = {
  options: {
    closeOnChainChange: true,
  },
  element: SpkGovernanceDelegateDialog,
}

interface SpkGovernanceDelegateDialogContentProps {
  action: 'delegate' | 'undelegate'
  chainId: number
  currentDelegate?: CheckedAddress
  closeDialog: () => void
}

function SpkGovernanceDelegateDialogContent({
  action,
  chainId,
  currentDelegate,
  closeDialog,
}: SpkGovernanceDelegateDialogContentProps) {
  const initialSelection = useMemo(() => {
    if (action === 'undelegate') {
      return 'none'
    }

    return currentDelegate ?? governanceDelegateOptions[0]!.address
  }, [action, currentDelegate])
  const [selectedDelegate, setSelectedDelegate] = useState<CheckedAddress | 'none'>(initialSelection)
  const selectedKnownDelegate =
    selectedDelegate === 'none'
      ? undefined
      : governanceDelegateOptions.find((delegate) => delegate.address.toLowerCase() === selectedDelegate.toLowerCase())
  const queryClient = useQueryClient()
  const [succeededAction, setSucceededAction] = useState<'delegate' | 'undelegate' | undefined>()

  function handleSettled(): void {
    void queryClient.invalidateQueries({ queryKey: spkGovernanceQueryKeyPrefix })
    setSucceededAction(selectedDelegate === 'none' ? 'undelegate' : 'delegate')
  }

  const delegateWrite = useWrite(
    {
      address: SNAPSHOT_DELEGATE_REGISTRY_ADDRESS,
      abi: snapshotDelegateRegistryAbi,
      functionName: 'setDelegate',
      args: [SPARK_SNAPSHOT_SPACE_ID, selectedDelegate === 'none' ? governanceDelegateOptions[0]!.address : selectedDelegate],
      chainId,
      enabled: selectedDelegate !== 'none' && selectedDelegate !== currentDelegate,
    },
    { onTransactionSettled: handleSettled },
  )

  const undelegateWrite = useWrite(
    {
      address: SNAPSHOT_DELEGATE_REGISTRY_ADDRESS,
      abi: snapshotDelegateRegistryAbi,
      functionName: 'clearDelegate',
      args: [SPARK_SNAPSHOT_SPACE_ID],
      chainId,
      enabled: selectedDelegate === 'none' && currentDelegate !== undefined,
    },
    { onTransactionSettled: handleSettled },
  )

  const activeWrite = selectedDelegate === 'none' ? undelegateWrite : delegateWrite
  const selectedIsCurrent = selectedDelegate !== 'none' && selectedDelegate === currentDelegate
  const selectedIsNoop = selectedIsCurrent || (selectedDelegate === 'none' && !currentDelegate)

  if (succeededAction) {
    return (
      <div className="flex flex-col gap-8">
        <DialogTitle>{succeededAction === 'delegate' ? 'Delegated voting power' : 'Undelegated voting power'}</DialogTitle>
        <div className="flex flex-col items-center gap-5 py-8 text-center">
          <CheckCircle2Icon className="h-16 w-16 text-system-success-primary" />
          <div className="flex flex-col gap-2">
            <div className="typography-heading-5">
              {succeededAction === 'delegate'
                ? `You delegated to ${selectedKnownDelegate?.name ?? 'selected delegate'}`
                : 'Delegation removed'}
            </div>
            <div className="typography-body-3 text-secondary">Your Spark Governance delegation has been updated.</div>
          </div>
        </div>
        <Button variant="primary" size="l" onClick={closeDialog}>
          Back to Governance
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <DialogTitle>{action === 'delegate' ? 'Delegate voting power' : 'Undelegate voting power'}</DialogTitle>

      {action === 'delegate' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {governanceDelegateOptions.map((delegate) => (
            <DelegateOptionCard
              key={delegate.address}
              delegate={delegate}
              selected={selectedDelegate === delegate.address}
              current={currentDelegate === delegate.address}
              onSelect={() => setSelectedDelegate(delegate.address)}
            />
          ))}
          <NoDelegateOptionCard
            selected={selectedDelegate === 'none'}
            currentDelegate={currentDelegate}
            onSelect={() => setSelectedDelegate('none')}
          />
        </div>
      ) : (
        <UndelegateConfirmation currentDelegate={currentDelegate} />
      )}

      <WriteError status={activeWrite.status} />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="tertiary" size="l" onClick={closeDialog}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="l"
          loading={isWriteLoading(activeWrite.status)}
          disabled={selectedIsNoop || activeWrite.status.kind !== 'ready'}
          onClick={activeWrite.write}
        >
          {getActionButtonLabel({
            selectedDelegate,
            selectedIsCurrent,
            status: activeWrite.status,
          })}
        </Button>
      </div>
    </div>
  )
}

interface DelegateOptionCardProps {
  delegate: GovernanceDelegateOption
  selected: boolean
  current: boolean
  onSelect: () => void
}

function DelegateOptionCard({ delegate, selected, current, onSelect }: DelegateOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-sm border border-primary bg-primary p-4 text-left shadow-xs transition',
        'focus-visible:outline-none focus-visible:ring focus-visible:ring-primary-200',
        selected && 'border-page-spark-token shadow-page-spark-token/15',
      )}
    >
      <div className="flex items-start gap-3">
        <DelegateAvatar name={delegate.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="typography-label-2 text-primary">{delegate.name}</div>
            {current && <div className="typography-label-4 rounded-full bg-secondary px-2 py-0.5 text-secondary">Current</div>}
          </div>
          <Address address={delegate.address} compact className="typography-label-3 mt-1 text-secondary" />
        </div>
      </div>
    </button>
  )
}

function NoDelegateOptionCard({
  selected,
  currentDelegate,
  onSelect,
}: {
  selected: boolean
  currentDelegate?: CheckedAddress
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-sm border border-primary bg-primary p-4 text-left shadow-xs transition',
        'focus-visible:outline-none focus-visible:ring focus-visible:ring-primary-200',
        selected && 'border-page-spark-token shadow-page-spark-token/15',
      )}
    >
      <div className="flex items-start gap-3">
        <DelegateAvatar name="No delegate" variant="neutral" />
        <div className="min-w-0 flex-1">
          <div className="typography-label-2 text-primary">No delegate</div>
          <div className="typography-label-3 mt-1 text-secondary">
            {currentDelegate ? 'Remove your current voting power delegation.' : 'Keep your voting power undelegated.'}
          </div>
        </div>
      </div>
    </button>
  )
}

function UndelegateConfirmation({ currentDelegate }: { currentDelegate?: CheckedAddress }) {
  return (
    <Panel spacing="s" className="flex flex-col gap-3">
      <div className="typography-body-3 text-secondary">
        This will remove your current Spark Governance delegate. You retain full ownership of your tokens.
      </div>
      {currentDelegate && (
        <div className="flex items-center justify-between gap-4 rounded-sm bg-secondary px-4 py-3">
          <div className="typography-label-3 text-secondary">Current delegate</div>
          <Address address={currentDelegate} compact className="typography-label-2 text-primary" />
        </div>
      )}
    </Panel>
  )
}

function DelegateAvatar({ name, variant = 'gradient' }: { name: string; variant?: 'gradient' | 'neutral' }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium',
        variant === 'gradient' ? 'bg-gradient-spark-primary-1 text-primary-inverse' : 'bg-secondary text-secondary',
      )}
    >
      {name.slice(0, 1)}
    </div>
  )
}

function WriteError({ status }: { status: WriteStatus }) {
  if (status.kind !== 'error') {
    return null
  }

  return (
    <div className="typography-body-4 rounded-sm bg-system-error-primary/10 px-4 py-3 text-system-error-primary">
      {status.error.message}
    </div>
  )
}

function isWriteLoading(status: WriteStatus): boolean {
  return status.kind === 'simulating' || status.kind === 'tx-sending' || status.kind === 'tx-mining'
}

function getActionButtonLabel({
  selectedDelegate,
  selectedIsCurrent,
  status,
}: {
  selectedDelegate: CheckedAddress | 'none'
  selectedIsCurrent: boolean
  status: WriteStatus
}) {
  if (selectedIsCurrent) {
    return 'Already delegated'
  }
  if (status.kind === 'simulating') {
    return 'Preparing...'
  }
  if (status.kind === 'tx-sending') {
    return 'Confirm in wallet'
  }
  if (status.kind === 'tx-mining') {
    return selectedDelegate === 'none' ? 'Undelegating...' : 'Delegating...'
  }

  return selectedDelegate === 'none' ? 'Undelegate' : 'Delegate'
}
