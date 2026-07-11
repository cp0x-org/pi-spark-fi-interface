import { ActionsContainer } from '@/features/actions/ActionsContainer'
import { Button } from '@/ui/atoms/button/Button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/atoms/tooltip/Tooltip'
import { assets } from '@/ui/assets'
import { PageLayout } from '@/ui/layouts/PageLayout'
import { InfoIcon } from 'lucide-react'
import { SwapAssetPanel } from '../components/SwapAssetPanel'
import { UseSwapResult, getSwapCtaLabel } from '../logic/useSwap'

export function SwapView({
  walletConnected,
  chainMismatch,
  fromAsset,
  toAsset,
  fromAssetOptions,
  toAssetOptions,
  amount,
  outcomeAmount,
  amountValue,
  amountExceedsBalance,
  actionsEnabled,
  objectives,
  actionsContext,
  setAmount,
  selectFromToken,
  selectToToken,
  setMaxAmount,
  switchTokens,
  openConnectModal,
  handleSwapSuccess,
}: UseSwapResult) {
  const ctaLabel = getSwapCtaLabel({ walletConnected, chainMismatch, amountValue, amountExceedsBalance })
  const showActions = walletConnected && !chainMismatch && amountValue.gt(0) && !amountExceedsBalance

  return (
    <PageLayout className="gap-7">
      <div className="flex items-center gap-1">
        <h1 className="font-roobert text-[48px] leading-[60px] font-medium tracking-normal text-primary">Swap</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="mt-3 h-3.5 w-3.5 text-neutral-400" />
          </TooltipTrigger>
          <TooltipContent>Swap stablecoins 1:1 through the Spark Peg Stability Module.</TooltipContent>
        </Tooltip>
      </div>

      <div className="mx-auto flex w-full max-w-[660px] flex-col gap-1.5">
        <div className="relative">
          <SwapAssetPanel
            label="From"
            selectedAsset={fromAsset}
            selectorAssets={fromAssetOptions}
            amount={amount}
            error={amountExceedsBalance ? 'Exceeds your balance' : undefined}
            maxAsset={fromAsset}
            onAmountChange={setAmount}
            onTokenChange={selectFromToken}
            onMaxClick={setMaxAmount}
          />

          <button
            type="button"
            className="absolute bottom-[-19px] left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-primary bg-primary shadow-glow-md transition hover:border-page-spark-token/40 hover:shadow-page-spark-token/15 focus-visible:outline-none focus-visible:ring focus-visible:ring-primary-200"
            onClick={switchTokens}
            aria-label="Switch tokens"
          >
            <img src={assets.brand.symbolGradient} alt="" className="h-4 w-4" />
          </button>
        </div>

        <SwapAssetPanel
          label="To"
          selectedAsset={toAsset}
          selectorAssets={toAssetOptions}
          amount={outcomeAmount}
          maxAsset={{ token: toAsset.token, balance: fromAsset.balance }}
          disabled
          onTokenChange={selectToToken}
          onMaxClick={setMaxAmount}
        />

        {showActions ? (
          <div className="mt-1 rounded-sm bg-primary p-4 shadow-xs">
            <ActionsContainer
              objectives={objectives}
              context={actionsContext}
              onFinish={handleSwapSuccess}
              actionsGridLayout="compact"
              enabled={actionsEnabled}
            />
          </div>
        ) : (
          <Button
            size="l"
            className="mt-1 h-12 w-full text-[16px] leading-5 font-medium tracking-normal"
            onClick={walletConnected ? undefined : openConnectModal}
            disabled={walletConnected}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </PageLayout>
  )
}
