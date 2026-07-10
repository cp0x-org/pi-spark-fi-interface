import { useFarmsInfo } from '@/domain/farms/useFarmsInfo'
import { usePageChainId } from '@/domain/hooks/usePageChainId'
import { FarmTileProps } from '../components/farm-tile/FarmTile'
import { getFarmTileProps } from './getFarmTileData'

export interface UseFarmsResult {
  activeFarms: FarmTileProps[]
  inactiveFarms: FarmTileProps[]
  chainId: number
}

export function useFarms(): UseFarmsResult {
  const { chainId } = usePageChainId()
  const { farmsInfo } = useFarmsInfo({ chainId })

  const activeFarms = farmsInfo
    .getActiveFarms()
    .filter((farm) => !farm.hiddenFromList)
    .map((farm) => getFarmTileProps({ farm, chainId }))
  const inactiveFarms = farmsInfo
    .getInactiveFarms()
    .filter((farm) => !farm.hiddenFromList)
    .map((farm) => getFarmTileProps({ farm, chainId }))

  return {
    activeFarms,
    inactiveFarms,
    chainId,
  }
}
