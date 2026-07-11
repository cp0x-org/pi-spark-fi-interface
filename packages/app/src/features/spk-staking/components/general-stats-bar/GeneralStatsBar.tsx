import { cn } from '@/ui/utils/style'
import { NormalizedUnitNumber } from '@sparkdotfi/common-universal'
import { ReactNode } from 'react'
import { GeneralStats } from '../../types'

export interface GeneralStatsBarProps {
  generalStats: GeneralStats
}

export function GeneralStatsBar({ generalStats }: GeneralStatsBarProps) {
  return (
    <div className={cn('inline-flex divide-x divide-secondary rounded-[10px]', 'bg-primary/80 py-3 backdrop-blur-lg')}>
      <Stat>
        <Label>Stakers:</Label>
        <Value>{formatCompactNumber(NormalizedUnitNumber(generalStats.stakers))}</Value>
      </Stat>
      <Stat>
        <Label>Total Staked:</Label>
        <Value>{formatCompactNumber(generalStats.totalStaked)}</Value>
      </Stat>
    </div>
  )
}

export function Stat({ children }: { children: ReactNode }) {
  return <div className="flex gap-1 px-3 sm:px-4">{children}</div>
}

function Label({ children }: { children: string }) {
  return <div className="typography-label-3 whitespace-nowrap text-secondary">{children}</div>
}

function Value({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('typography-label-3 text-primary', className)}>{children}</div>
}

function formatCompactNumber(value: NormalizedUnitNumber): string {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value.toNumber())
}
