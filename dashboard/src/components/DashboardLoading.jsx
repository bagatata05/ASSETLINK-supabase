import React from 'react';
import { Skeleton } from './ui/skeleton';

const DashboardLoading = () => {
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="w-64 border-r bg-sidebar-background flex flex-col p-4 space-y-6 shrink-0">
                <div className="flex items-center gap-3 px-2">
                    <Skeleton className="w-10 h-10 rounded-xl bg-sidebar-primary/20" />
                    <Skeleton className="h-4 w-24 bg-sidebar-foreground/10" />
                </div>
                <div className="space-y-3 pt-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg bg-sidebar-accent/30" />
                    ))}
                </div>
                <div className="mt-auto space-y-3 pb-4">
                    <Skeleton className="h-10 w-full rounded-lg bg-sidebar-accent/30" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar Skeleton */}
                <header className="h-16 border-b flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-32 rounded-lg" />
                    </div>
                </header>

                {/* Page Content Skeleton */}
                <main className="flex-1 p-8 overflow-auto">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="flex justify-between items-end">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-6 border rounded-2xl bg-card space-y-3">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            ))}
                        </div>

                        {/* Main Content Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="p-8 border rounded-3xl bg-card h-[400px]">
                                    <Skeleton className="h-full w-full rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-8 border rounded-3xl bg-card h-[400px] space-y-4">
                                    <Skeleton className="h-6 w-1/2" />
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Skeleton key={i} className="h-12 w-full rounded-xl" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLoading;
