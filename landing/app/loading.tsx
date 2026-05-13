import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      {/* Nav Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="hidden gap-6 md:flex">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Skeleton */}
        <section className="container pt-24 pb-16 md:pt-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <Skeleton className="h-6 w-48 rounded-full" />
            <div className="space-y-4 w-full max-w-3xl flex flex-col items-center">
              <Skeleton className="h-16 w-full md:w-4/5" />
              <Skeleton className="h-16 w-3/4 md:w-2/3" />
            </div>
            <Skeleton className="h-12 w-full max-w-md" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </section>

        {/* Trust Bar Skeleton */}
        <div className="border-y bg-muted/30 py-8">
          <div className="container flex flex-wrap justify-center gap-8 md:gap-16 opacity-50">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Role Preview / Features Skeleton */}
        <section className="container py-24 space-y-12">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4 border rounded-2xl p-6 bg-card">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <div className="pt-4 flex gap-2">
                   <Skeleton className="h-4 w-12" />
                   <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Analytics Preview Skeleton */}
        <section className="bg-muted/50 py-24 overflow-hidden">
          <div className="container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
            <div className="relative">
              <Skeleton className="aspect-video w-full rounded-3xl" />
              <div className="absolute -bottom-6 -left-6 h-32 w-32">
                <Skeleton className="h-full w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
