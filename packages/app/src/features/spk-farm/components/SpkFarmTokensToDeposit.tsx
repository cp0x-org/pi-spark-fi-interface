import { TokenWithBalance } from '@/domain/common/types'
import { Token } from '@/domain/types/Token'
import { Button } from '@/ui/atoms/button/Button'
import { Panel } from '@/ui/atoms/panel/Panel'
import { DataTable, DataTableColumnDefinitions } from '@/ui/molecules/data-table/DataTable'
import { TokenCell } from '@/ui/molecules/data-table/components/TokenCell'
import { ViewContractMoreDropdown } from '@/ui/molecules/view-contract-more-dropdown/ViewContractMoreDropdown'
import { CheckedAddress } from '@sparkdotfi/common-universal'
import { useMemo } from 'react'

export interface SpkFarmTokensToDepositProps {
  assets: TokenWithBalance[]
  getBlockExplorerAddressLink: (address: CheckedAddress) => string | undefined
  openStakeDialog: (token: Token) => void
}

export function SpkFarmTokensToDeposit({
  assets,
  getBlockExplorerAddressLink,
  openStakeDialog,
}: SpkFarmTokensToDepositProps) {
  const columnDef: DataTableColumnDefinitions<TokenWithBalance> = useMemo(
    () => ({
      token: {
        header: 'Token',
        renderCell: ({ token }) => <TokenCell token={token} />,
      },
      balance: {
        header: 'Balance',
        headerAlign: 'right',
        renderCell: ({ balance, token }) => (
          <div className="typography-label-2 flex w-full flex-row justify-end">
            {balance.eq(0) ? '-' : token.format(balance, { style: 'auto' })}
          </div>
        ),
      },
      actions: {
        header: '',
        renderCell: ({ token, balance }) => (
          <div className="flex w-full flex-row items-center justify-end gap-3">
            <Button variant="tertiary" size="s" disabled={balance.eq(0)} onClick={() => openStakeDialog(token)}>
              Deposit
            </Button>
            <ViewContractMoreDropdown blockExplorerLink={getBlockExplorerAddressLink(token.address)} />
          </div>
        ),
      },
    }),
    [getBlockExplorerAddressLink, openStakeDialog],
  )

  return (
    <Panel className="flex flex-col gap-6">
      <h2 className="typography-heading-5">Tokens to deposit</h2>
      <DataTable gridTemplateColumnsClassName="grid-cols-[1fr_1fr_132px]" data={assets} columnDef={columnDef} />
    </Panel>
  )
}
