import { withSuspense } from '@/ui/utils/withSuspense'
import { SwapSkeleton } from './components/SwapSkeleton'
import { useSwap } from './logic/useSwap'
import { SwapView } from './views/SwapView'

function SwapContainer() {
  const swap = useSwap()

  return <SwapView {...swap} />
}

const SwapContainerWithSuspense = withSuspense(SwapContainer, SwapSkeleton)
export { SwapContainerWithSuspense as SwapContainer }
