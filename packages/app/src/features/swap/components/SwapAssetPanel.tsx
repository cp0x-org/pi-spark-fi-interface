import { TokenWithBalance } from '@/domain/common/types'
import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { cn } from '@/ui/utils/style'
import { WalletCardsIcon } from 'lucide-react'
import { ChangeEvent } from 'react'
import { formatTokenBalance } from '../logic/useSwap'
import { SwapTokenSelector } from './SwapTokenSelector'

export interface SwapAssetPanelProps {
  label: 'From' | 'To'
  selectedAsset: TokenWithBalance
  selectorAssets: TokenWithBalance[]
  amount: string
  error?: string
  showBalance?: boolean
  disabled?: boolean
  onAmountChange?: (value: string) => void
  onTokenChange: (symbol: TokenSymbol) => void
  className?: string
}

export function SwapAssetPanel({
  label,
  selectedAsset,
  selectorAssets,
  amount,
  error,
  showBalance = false,
  disabled = false,
  onAmountChange,
  onTokenChange,
  className,
}: SwapAssetPanelProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    onAmountChange?.(e.target.value)
  }

  return (
    <section className={cn('rounded-sm bg-primary p-6 sm:p-8', className)}>
      <div className="text-[18px] leading-6 font-medium tracking-normal text-primary">{label}</div>
      <div
        className={cn(
          'mt-4 grid min-h-[68px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-sm border border-primary bg-secondary p-2 pr-4',
          showBalance && 'grid-cols-[auto_minmax(0,1fr)_auto]',
          error && 'border-[#ff4f5b] bg-[#ffe2e2]',
        )}
      >
        <SwapTokenSelector
          selectedToken={selectedAsset.token}
          assets={selectorAssets}
          onChange={onTokenChange}
        />

        <input
          type="text"
          inputMode="decimal"
          placeholder="0"
          className={cn(
            'h-12 min-w-0 bg-transparent text-[16px] leading-5 font-medium tracking-normal text-primary outline-none placeholder:text-primary',
            disabled && 'cursor-default',
          )}
          value={amount}
          onChange={handleChange}
          disabled={disabled}
          autoComplete="off"
        />

        {showBalance && (
          <div className="flex shrink-0 items-center gap-1 text-[14px] leading-5 font-medium tracking-normal text-secondary">
            <WalletCardsIcon className="h-3.5 w-3.5" />
            <span>
              {formatTokenBalance(selectedAsset.token, selectedAsset.balance)} {selectedAsset.token.symbol}
            </span>
          </div>
        )}
      </div>
      {error && <div className="mt-2 text-[14px] leading-5 font-medium tracking-normal text-[#d91838]">{error}</div>}
    </section>
  )
}
