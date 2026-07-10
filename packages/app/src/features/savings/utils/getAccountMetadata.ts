import { findSparkVaultBySavingsTokenSymbol } from '@/config/chain/constants'
import { TokenSymbol } from '@/domain/types/TokenSymbol'
import { links } from '@/ui/constants/links'
import { gnosis } from 'viem/chains'
import { AccountMetadata } from '../types'

export interface GetAccountMetadataArgs {
  underlyingToken: TokenSymbol
  savingsToken: TokenSymbol
  chainId: number
}

export function getAccountMetadata({
  underlyingToken,
  savingsToken,
  chainId,
}: GetAccountMetadataArgs): AccountMetadata {
  return {
    description: getAccountDescription({ underlyingToken, savingsToken, chainId }),
    apyExplainer: getApyExplainer({ underlyingToken, savingsToken, chainId }),
    descriptionDocsLink: getDocsLink({ underlyingToken, savingsToken, chainId }),
    apyExplainerDocsLink: getDocsLink({ underlyingToken, savingsToken, chainId }),
  }
}

function getAccountDescription({ underlyingToken, savingsToken, chainId }: GetAccountMetadataArgs): string {
  if (chainId === gnosis.id) {
    return 'Deposit your stablecoins into XDAI\u00A0Savings to tap into the DAI\u00A0Savings\u00A0Rate, which grants you a predictable APY in XDAI.'
  }
  if (findSparkVaultBySavingsTokenSymbol(savingsToken)) {
    return `Deposit your ${underlyingToken} into ${underlyingToken}\u00A0Savings to tap into the Spark\u00A0Savings\u00A0Rate, which grants you a predictable APY in ${underlyingToken}.`
  }
  if (underlyingToken === TokenSymbol('DAI')) {
    return 'Deposit your stablecoins into DAI\u00A0Savings to tap into the DAI\u00A0Savings\u00A0Rate, which grants you a predictable APY in DAI.'
  }
  return `Deposit your stablecoins into ${underlyingToken}\u00A0Savings to tap into the Sky\u00A0Savings\u00A0Rate, which grants you a predictable APY in ${underlyingToken}.`
}

function getApyExplainer({ underlyingToken, savingsToken, chainId }: GetAccountMetadataArgs): string {
  if (chainId === gnosis.id) {
    return 'All interest from the xDAI Bridge on the Ethereum mainnet is being redirected to Gnosis sDAI. The bridge converts its DAI deposits into DAI Savings on the mainnet, which then accumulates the DSR. The DSR is set on mainnet by Sky Ecosystem Governance. Keep in mind that these protocol mechanisms are subject to change.'
  }
  if (findSparkVaultBySavingsTokenSymbol(savingsToken)) {
    return `Current annual interest rate for ${underlyingToken} deposited into the ${savingsToken} vault. It is determined on-chain by the Vault Savings Rate (VSR). Please note that these protocol mechanisms are subject to change.`
  }
  if (underlyingToken === TokenSymbol('DAI')) {
    return 'Current annual interest rate for DAI deposited into the Sky Savings Module. It is determined on-chain by the Sky Ecosystem Governance. Please note that these protocol mechanisms are subject to change.'
  }
  return 'Current annual interest in the Sky Savings Module. It is determined on-chain by the Sky Ecosystem Governance. Please note that these protocol mechanisms are subject to change.'
}

function getDocsLink({ underlyingToken, savingsToken, chainId }: GetAccountMetadataArgs): string {
  if (chainId === gnosis.id) {
    return links.docs.savings.gnosisSdai
  }
  if (findSparkVaultBySavingsTokenSymbol(savingsToken)) {
    return links.docs.savings.susds
  }
  if (underlyingToken === TokenSymbol('DAI')) {
    return links.docs.savings.sdai
  }
  if (underlyingToken === TokenSymbol('USDC')) {
    return links.docs.savings.susdc
  }
  return links.docs.savings.susds
}
