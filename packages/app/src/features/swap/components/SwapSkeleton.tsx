import { PageLayout } from '@/ui/layouts/PageLayout'

export function SwapSkeleton() {
  return (
    <PageLayout className="gap-7">
      <div className="h-[60px] w-36 animate-pulse rounded-sm bg-neutral-100" />
      <div className="mx-auto flex w-full max-w-[660px] flex-col gap-1.5">
        <div className="h-[194px] animate-pulse rounded-sm bg-primary" />
        <div className="h-[172px] animate-pulse rounded-sm bg-primary" />
        <div className="h-12 animate-pulse rounded-sm bg-neutral-100" />
      </div>
    </PageLayout>
  )
}
