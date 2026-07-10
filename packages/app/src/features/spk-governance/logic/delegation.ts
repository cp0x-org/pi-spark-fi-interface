import { CheckedAddress } from '@sparkdotfi/common-universal'
import { Address, getAddress, padHex, stringToHex } from 'viem'

export const SPARK_SNAPSHOT_SPACE = 'sparkfi.eth'
export const SPARK_SNAPSHOT_SPACE_ID = padHex(stringToHex(SPARK_SNAPSHOT_SPACE), { dir: 'right', size: 32 })
export const SNAPSHOT_DELEGATE_REGISTRY_ADDRESS = CheckedAddress('0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446')

export const snapshotDelegateRegistryAbi = [
  {
    type: 'event',
    name: 'ClearDelegate',
    inputs: [
      { name: 'delegator', type: 'address', indexed: true },
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'delegate', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'SetDelegate',
    inputs: [
      { name: 'delegator', type: 'address', indexed: true },
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'delegate', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'function',
    name: 'clearDelegate',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'delegation',
    inputs: [
      { name: 'delegator', type: 'address' },
      { name: 'id', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setDelegate',
    inputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'delegate', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

export interface GovernanceDelegateOption {
  address: CheckedAddress
  name: string
}

export const governanceDelegateOptions: GovernanceDelegateOption[] = [
  {
    address: CheckedAddress(getAddress('0x71faa03c0cebcbb53236763b6b118ad906d9f6d3')),
    name: 'NeoNode',
  },
  {
    address: CheckedAddress(getAddress('0xdc5d4228a42880f5bbd577a184035503bd55799a')),
    name: 'Remi',
  },
  {
    address: CheckedAddress(getAddress('0xF80A26ee68Bdf0224c18F85876b20858ee5206A9')),
    name: 'TheMoon',
  },
]

export function getWhitelistedGovernanceDelegate(address: Address | CheckedAddress): GovernanceDelegateOption | undefined {
  return governanceDelegateOptions.find((delegate) => delegate.address.toLowerCase() === address.toLowerCase())
}

export function isWhitelistedGovernanceDelegate(address: Address | CheckedAddress): boolean {
  return getWhitelistedGovernanceDelegate(address) !== undefined
}

export const spkGovernanceQueryKeyPrefix = ['spk-governance'] as const
