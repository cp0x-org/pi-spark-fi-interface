import { withSuspense } from '@/ui/utils/withSuspense'
import { SpkFarmSkeleton } from './components/SpkFarmSkeleton'
import { useSpkFarm } from './logic/useSpkFarm'
import { SpkFarmView } from './views/SpkFarmView'

function SpkFarmContainer() {
  const spkFarm = useSpkFarm()

  return <SpkFarmView {...spkFarm} />
}

const SpkFarmContainerWithSuspense = withSuspense(SpkFarmContainer, SpkFarmSkeleton)
export { SpkFarmContainerWithSuspense as SpkFarmContainer }
