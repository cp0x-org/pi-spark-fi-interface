import { Skeleton } from '@/ui/atoms/skeleton/Skeleton'
import { PageLayout } from '@/ui/layouts/PageLayout'

export function SpkGovernanceSkeleton() {
  return (
    <PageLayout className="gap-5">
      <Skeleton className="h-12 w-80 max-w-full" />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[11fr_5fr]">
        <div className="grid grid-cols-1 gap-5">
          <Skeleton className="h-[260px] w-full" />
          <Skeleton className="h-[260px] w-full" />
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    </PageLayout>
  )
}
