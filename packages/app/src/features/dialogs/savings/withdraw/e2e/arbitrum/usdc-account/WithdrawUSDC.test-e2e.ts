import { psm3Address } from '@/config/contracts-generated'
import { SavingsDialogPageObject } from '@/features/dialogs/savings/common/e2e/SavingsDialog.PageObject'
import { SavingsPageObject } from '@/pages/Savings.PageObject'
import { ARBITRUM_SUSDC_ACTIVE_BLOCK_NUMBER, TOKENS_ON_FORK } from '@/test/e2e/constants'
import { TestContext, setup } from '@/test/e2e/setup'
import { test } from '@playwright/test'
import { arbitrum } from 'viem/chains'
import { withdrawValidationIssueToMessage } from '../../../logic/validation'

test.describe('Withdraw USDC', () => {
  let savingsPage: SavingsPageObject
  let withdrawDialog: SavingsDialogPageObject
  let testContext: TestContext

  test.beforeEach(async ({ page }) => {
    testContext = await setup(page, {
      blockchain: {
        chain: arbitrum,
        blockNumber: ARBITRUM_SUSDC_ACTIVE_BLOCK_NUMBER,
      },
      initialPage: 'savings',
      account: {
        type: 'connected-random',
        assetBalances: {
          ETH: 1,
          USDC: 10_000,
        },
      },
    })

    savingsPage = new SavingsPageObject(testContext)
    await savingsPage.clickSavingsNavigationItemAction('USDC')
    await savingsPage.clickDepositButtonAction('USDC')

    const depositDialog = new SavingsDialogPageObject({ testContext, type: 'deposit' })
    await depositDialog.fillAmountAction(10_000)
    await depositDialog.actionsContainer.acceptAllActionsAction(2)
    await depositDialog.clickBackToSavingsButton()

    await savingsPage.clickWithdrawFromAccountButtonAction()
    withdrawDialog = new SavingsDialogPageObject({ testContext, type: 'withdraw' })
    await withdrawDialog.selectAssetAction('USDC')
    await withdrawDialog.fillAmountAction(1000)
  })

  test('has correct action plan', async () => {
    await withdrawDialog.actionsContainer.expectActions([
      { type: 'withdrawFromSavings', asset: 'USDC', savingsAsset: 'sUSDC', mode: 'withdraw' },
    ])
  })

  test('displays transaction overview', async () => {
    await withdrawDialog.expectNativeRouteTransactionOverview({
      routeItems: [
        {
          tokenAmount: '960.17 sUSDC',
          tokenUsdValue: '$1,000.00',
        },
        {
          tokenAmount: '1,000.00 USDC',
          tokenUsdValue: '$1,000.00',
        },
      ],
      outcome: '1,000.00 USDC',
      outcomeUsd: '$1,000.00',
    })

    await withdrawDialog.expectUpgradeSwitchToBeHidden()
  })

  test('executes withdraw', async () => {
    await withdrawDialog.actionsContainer.acceptAllActionsAction(1)

    await withdrawDialog.expectSuccessPage()
    await withdrawDialog.clickBackToSavingsButton()

    await savingsPage.expectSavingsAccountBalance({ balance: '8,641.52', estimatedValue: '9,000.0000988' })
    await savingsPage.expectSupportedStablecoinBalance('USDC', '1,000')
  })

  test('executes withdraw for small amount', async () => {
    await withdrawDialog.fillAmountAction(1)
    await withdrawDialog.actionsContainer.acceptAllActionsAction(1)

    await withdrawDialog.expectSuccessPage()
    await withdrawDialog.clickBackToSavingsButton()

    await savingsPage.expectSavingsAccountBalance({ balance: '9,600.73', estimatedValue: '9,999.0000993' })
    await savingsPage.expectSupportedStablecoinBalance('USDC', '1')
  })

  test('fails validation if psm3 usdc balance is too low', async ({ page }) => {
    await testContext.testnetController.client.setErc20Balance(
      TOKENS_ON_FORK[arbitrum.id].USDC.address,
      psm3Address[arbitrum.id],
      0n,
    )
    await testContext.testnetController.progressSimulation(5)
    await page.reload()
    await savingsPage.clickSavingsNavigationItemAction('USDC')

    await savingsPage.clickWithdrawFromAccountButtonAction()
    withdrawDialog = new SavingsDialogPageObject({ testContext, type: 'withdraw' })
    await withdrawDialog.fillAmountAction(1000)

    await withdrawDialog.expectAssetInputError(withdrawValidationIssueToMessage['usdc-withdraw-cap-reached'])
  })
})
