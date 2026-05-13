import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}) {
    return (
        <div
            className={cn(
                "relative bg-muted/40 animate-pulse overflow-hidden",
                "border border-border/50",
                "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-foreground/5 after:to-transparent after:animate-shimmer",
                className
            )}
            {...props}
        >
            {/* Blueprint lines */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:16px_16px]" />
            </div>
        </div>
    );
}

export { Skeleton }
