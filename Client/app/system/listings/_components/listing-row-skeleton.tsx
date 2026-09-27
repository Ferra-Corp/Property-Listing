import { Skeleton } from "@/components/ui/skeleton"

/**
 * Matches ListingRow's layout so replacing "Loading…" with a stack of these
 * doesn't shift the page. Kept intentionally simple — three columns on md,
 * a single stacked row on mobile.
 */
export function ListingRowSkeleton() {
  return (
    <article
      className="grid items-start gap-3 border-b border-(--color-divider) py-5 md:grid-cols-[300px_1fr_190px] md:gap-6 md:py-6"
      aria-busy="true"
    >
      <Skeleton className="aspect-16/10 w-full rounded-xl" />

      <div className="flex flex-col gap-2 pt-1 md:pt-0">
        <Skeleton className="h-3 w-2/5 rounded-full" />
        <Skeleton className="h-6 w-4/5 rounded-md" />
        <Skeleton className="h-3 w-3/5 rounded-full" />
        <Skeleton className="mt-1 hidden h-16 w-full rounded-md md:block" />
        <div className="mt-1 hidden gap-2 md:flex">
          <Skeleton className="h-6 w-14 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 pt-1 md:mt-0 md:block">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-24 rounded-md md:ml-auto" />
          <Skeleton className="h-3 w-16 rounded-full md:ml-auto" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg md:mt-4" />
      </div>
    </article>
  )
}

export function ListingRowSkeletonGroup({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ListingRowSkeleton key={i} />
      ))}
    </>
  )
}
