import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentPropsWithRef<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'relative bg-muted/40 animate-pulse overflow-hidden',
        'border border-muted/50',
        'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-muted/20 after:to-transparent after:animate-shimmer',
        className
      )}
      {...props}
    >
      {/* Blueprint lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>
    </div>
  )
}

export { Skeleton }
