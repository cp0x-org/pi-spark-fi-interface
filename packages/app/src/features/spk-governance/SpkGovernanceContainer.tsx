import { withSuspense } from '@/ui/utils/withSuspense'
import { SpkGovernanceSkeleton } from './components/SpkGovernanceSkeleton'
import { useSpkGovernance } from './logic/useSpkGovernance'
import { SpkGovernanceView } from './views/SpkGovernanceView'

function SpkGovernanceContainer() {
  const spkGovernance = useSpkGovernance()

  return <SpkGovernanceView {...spkGovernance} />
}

const SpkGovernanceContainerWithSuspense = withSuspense(SpkGovernanceContainer, SpkGovernanceSkeleton)
export { SpkGovernanceContainerWithSuspense as SpkGovernanceContainer }
