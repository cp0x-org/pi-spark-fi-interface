import { getChainConfigEntry } from '@/config/chain'
import { formFormat } from '@/domain/common/format'
import { TokenWithBalance } from '@/domain/common/types'
import { usePageChainId } from '@/domain/hooks/usePageChainId'
import { useTokenRepositoryForFeature } from '@/domain/token-repository/useTokenRepositoryForFeature'
import { Token } from '@/domain/types/Token'
import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { ConvertStablesObjective } from '@/features/actions/flavours/convert-stables/types'
import { InjectedActionsContext } from '@/features/actions/logic/types'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { NormalizedUnitNumber, assert } from '@sparkdotfi/common-universal'
import { useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId } from 'wagmi'

const USDC = TokenSymbol('USDC')
const USDS = TokenSymbol('USDS')
const DECIMAL_NUMBER_REGEX = /^\d+\.?\d*$/

export interface UseSwapResult {
  walletConnected: boolean
  chainMismatch: boolean
  fromAsset: TokenWithBalance
  toAsset: TokenWithBalance
  fromAssetOptions: TokenWithBalance[]
  toAssetOptions: TokenWithBalance[]
  amount: string
  outcomeAmount: string
  amountValue: NormalizedUnitNumber
  amountExceedsBalance: boolean
  actionsEnabled: boolean
  objectives: ConvertStablesObjective[]
  actionsContext: InjectedActionsContext
  setAmount: (value: string) => void
  selectFromToken: (symbol: TokenSymbol) => void
  selectToToken: (symbol: TokenSymbol) => void
  setMaxAmount: () => void
  switchTokens: () => void
  openConnectModal: () => void
  handleSwapSuccess: () => void
}

export function useSwap(): UseSwapResult {
  const { chainId } = usePageChainId()
  const connectedChainId = useChainId()
  const { address: account } = useAccount()
  const walletConnected = account !== undefined
  const chainMismatch = walletConnected && connectedChainId !== chainId
  const { openConnectModal = () => {} } = useConnectModal()

  const chainConfig = getChainConfigEntry(chainId)
  const psmStables = chainConfig.savings?.psmStables
  assert(psmStables && psmStables.length > 1, 'PSM stables are not defined on this chain')

  const { tokenRepository } = useTokenRepositoryForFeature({ chainId, featureGroup: 'swap' })
  const defaultPair = useMemo(() => getDefaultPair(psmStables), [psmStables])
  const [fromTokenSymbol, setFromTokenSymbol] = useState(defaultPair.from)
  const [toTokenSymbol, setToTokenSymbol] = useState(defaultPair.to)
  const [amount, setAmountState] = useState('')

  useEffect(() => {
    setFromTokenSymbol(defaultPair.from)
    setToTokenSymbol(defaultPair.to)
    setAmountState('')
  }, [defaultPair])

  const effectiveFromTokenSymbol = psmStables.includes(fromTokenSymbol) ? fromTokenSymbol : defaultPair.from
  const effectiveToTokenSymbol =
    psmStables.includes(toTokenSymbol) && toTokenSymbol !== effectiveFromTokenSymbol ? toTokenSymbol : defaultPair.to

  const assets = psmStables.map((symbol) => tokenRepository.findOneTokenWithBalanceBySymbol(symbol))
  const fromAsset = tokenRepository.findOneTokenWithBalanceBySymbol(effectiveFromTokenSymbol)
  const toAsset = tokenRepository.findOneTokenWithBalanceBySymbol(effectiveToTokenSymbol)

  const amountValue = NormalizedUnitNumber(amount === '' ? '0' : amount)
  const amountExceedsBalance = amountValue.gt(0) && amountValue.gt(fromAsset.balance)
  const actionsEnabled = walletConnected && !chainMismatch && amountValue.gt(0) && !amountExceedsBalance

  function setAmount(value: string): void {
    const normalizedValue = value.replace(/,/g, '.').replace(/\s/g, '')
    const fractionDigits = normalizedValue.split('.')[1]?.length ?? 0

    if (
      !normalizedValue ||
      (DECIMAL_NUMBER_REGEX.test(normalizedValue) && fractionDigits <= fromAsset.token.decimals)
    ) {
      setAmountState(normalizedValue)
    }
  }

  function selectFromToken(symbol: TokenSymbol): void {
    if (symbol === effectiveToTokenSymbol) {
      setToTokenSymbol(effectiveFromTokenSymbol)
    }

    setFromTokenSymbol(symbol)
    setAmountState('')
  }

  function selectToToken(symbol: TokenSymbol): void {
    setToTokenSymbol(symbol)
  }

  function setMaxAmount(): void {
    setAmountState(formFormat(fromAsset.balance, fromAsset.token.decimals))
  }

  function switchTokens(): void {
    setFromTokenSymbol(effectiveToTokenSymbol)
    setToTokenSymbol(effectiveFromTokenSymbol)
  }

  const objectives: ConvertStablesObjective[] = [
    {
      type: 'convertStables',
      inToken: fromAsset.token,
      outToken: toAsset.token,
      amount: amountValue,
    },
  ]

  return {
    walletConnected,
    chainMismatch,
    fromAsset,
    toAsset,
    fromAssetOptions: assets.filter(({ token }) => token.symbol !== fromAsset.token.symbol),
    toAssetOptions: assets.filter(
      ({ token }) => token.symbol !== toAsset.token.symbol && token.symbol !== fromAsset.token.symbol,
    ),
    amount,
    outcomeAmount: amount,
    amountValue,
    amountExceedsBalance,
    actionsEnabled,
    objectives,
    actionsContext: { tokenRepository },
    setAmount,
    selectFromToken,
    selectToToken,
    setMaxAmount,
    switchTokens,
    openConnectModal,
    handleSwapSuccess: () => setAmountState(''),
  }
}

function getDefaultPair(stables: TokenSymbol[]): { from: TokenSymbol; to: TokenSymbol } {
  const from = stables.includes(USDC) ? USDC : stables[0]!
  const to = stables.includes(USDS) && USDS !== from ? USDS : (stables.find((symbol) => symbol !== from) ?? stables[1]!)

  return { from, to }
}

export function getSwapCtaLabel({
  walletConnected,
  chainMismatch,
  amountValue,
  amountExceedsBalance,
}: {
  walletConnected: boolean
  chainMismatch: boolean
  amountValue: NormalizedUnitNumber
  amountExceedsBalance: boolean
}): string {
  if (!walletConnected) {
    return 'Connect Wallet'
  }

  if (chainMismatch) {
    return 'Wrong network'
  }

  if (amountValue.isZero()) {
    return 'Enter an amount'
  }

  if (amountExceedsBalance) {
    return 'Insufficient balance'
  }

  return 'Swap'
}

export function formatTokenBalance(token: Token, balance: NormalizedUnitNumber): string {
  return token.format(balance, { style: 'compact' })
}
