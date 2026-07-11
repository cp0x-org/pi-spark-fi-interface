import { Panel } from '@/ui/atoms/panel/Panel'
import { PageLayout } from '@/ui/layouts/PageLayout'

export function SpkFarmSkeleton() {
  return (
    <PageLayout>
      <div className="h-12 w-56 animate-pulse rounded-sm bg-neutral-100" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel className="min-h-[414px] animate-pulse bg-neutral-100" />
        <Panel className="min-h-[414px] animate-pulse bg-neutral-100" />
      </div>
      <Panel className="h-44 animate-pulse bg-neutral-100" />
    </PageLayout>
  )
}
