import { TokenWithBalance } from '@/domain/common/types'
import { Token } from '@/domain/types/Token'
import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/ui/atoms/select/Select'
import { TokenIcon } from '@/ui/atoms/token-icon/TokenIcon'
import { cn } from '@/ui/utils/style'
import { NormalizedUnitNumber } from '@sparkdotfi/common-universal'

export interface SwapTokenSelectorProps {
  selectedToken: Token
  assets: TokenWithBalance[]
  onChange: (symbol: TokenSymbol) => void
}

export function SwapTokenSelector({ selectedToken, assets, onChange }: SwapTokenSelectorProps) {
  if (assets.length === 0) {
    return (
      <div className="flex h-12 min-w-[120px] items-center gap-2 rounded-sm border border-primary bg-primary px-3 shadow-xs">
        <TokenIcon token={selectedToken} className="h-6 w-6 shrink-0" />
        <span className="text-[16px] leading-5 font-medium tracking-normal text-primary">{selectedToken.symbol}</span>
      </div>
    )
  }

  return (
    <Select value={selectedToken.symbol} onValueChange={(value) => onChange(TokenSymbol(value))}>
      <SelectTrigger className="h-12 min-w-[120px] gap-2 bg-primary px-3 py-2 shadow-xs">
        <div className="flex min-w-0 items-center gap-2">
          <TokenIcon token={selectedToken} className="h-6 w-6 shrink-0" />
          <span className="truncate text-[16px] leading-5 font-medium tracking-normal text-primary">
            {selectedToken.symbol}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="min-w-[248px]">
        {assets.map(({ token, balance }) => (
          <SelectItem key={token.symbol} value={token.symbol} className="px-3 py-4">
            <div className="flex min-w-[224px] items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-2">
                <TokenIcon token={token} className="h-6 w-6 shrink-0" />
                <span className="truncate text-[16px] leading-5 font-medium tracking-normal text-primary">
                  {token.symbol}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="text-[12px] leading-[18px] font-medium tracking-normal text-secondary">Balance</span>
                <span className={cn('text-[12px] leading-[18px] font-medium tracking-normal text-primary')}>
                  {formatSelectorBalance(token, balance)}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function formatSelectorBalance(token: Token, balance: NormalizedUnitNumber): string {
  return token.format(balance, { style: 'compact' })
}
