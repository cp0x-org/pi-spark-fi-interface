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
  maxAsset: TokenWithBalance
  disabled?: boolean
  onAmountChange?: (value: string) => void
  onTokenChange: (symbol: TokenSymbol) => void
  onMaxClick: () => void
  className?: string
}

export function SwapAssetPanel({
  label,
  selectedAsset,
  selectorAssets,
  amount,
  error,
  maxAsset,
  disabled = false,
  onAmountChange,
  onTokenChange,
  onMaxClick,
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
          'mt-4 grid min-h-[68px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-sm border border-primary bg-secondary p-2 pr-4',
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

        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <button
            type="button"
            onClick={onMaxClick}
            className="text-[14px] leading-5 font-medium tracking-normal text-brand-primary transition-colors hover:text-primary-950 focus-visible:outline-none focus-visible:ring focus-visible:ring-primary-200"
          >
            MAX
          </button>
          <div className="flex items-center gap-1 text-[12px] leading-[18px] font-medium tracking-normal text-secondary">
            <WalletCardsIcon className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatTokenBalance(maxAsset.token, maxAsset.balance)} {maxAsset.token.symbol}
            </span>
          </div>
        </div>
      </div>
      {error && <div className="mt-2 text-[14px] leading-5 font-medium tracking-normal text-[#d91838]">{error}</div>}
    </section>
  )
}
