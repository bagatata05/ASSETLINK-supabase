import React from 'react';
import { Skeleton } from './ui/skeleton';

const AuthLoading = () => {
    return (
        <div className="h-screen grid lg:grid-cols-2 font-sans bg-background overflow-hidden">
            {/* Left Side: Form Skeleton */}
            <div className="flex flex-col items-center justify-center px-8 py-6 lg:px-20 relative">
                <div className="w-full max-w-[400px] space-y-12">
                    {/* Logo & Back Link Area */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                    </div>

                    {/* Title Area */}
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-16 ml-1" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        
                        {/* Checkbox */}
                        <div className="flex items-center gap-2 ml-1">
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-4 w-32" />
                        </div>

                        {/* Buttons */}
                        <div className="space-y-4 pt-4">
                            <Skeleton className="h-11 w-full rounded-xl" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>

                        {/* Footer Link */}
                        <div className="flex justify-center pt-4">
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Typography Brand Panel Skeleton */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-emerald-950 p-12 relative overflow-hidden">
                {/* Simulated Blueprint Grid for the brand side */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                <div className="w-full max-w-[540px] space-y-12 relative z-10 text-left">
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-12 bg-emerald-400/30" />
                                <Skeleton className="h-3 w-32 bg-emerald-400/10" />
                            </div>
                            
                            <div className="space-y-4">
                                <Skeleton className="h-16 w-3/4 bg-emerald-400/10" />
                                <Skeleton className="h-16 w-1/2 bg-emerald-400/10" />
                                <Skeleton className="h-16 w-2/3 bg-emerald-400/10" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Skeleton className="h-4 w-full bg-emerald-400/5" />
                            <Skeleton className="h-4 w-5/6 bg-emerald-400/5" />
                            
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-24 bg-emerald-400/10" />
                                    <Skeleton className="h-3 w-20 bg-emerald-400/5" />
                                </div>
                                <div className="space-y-3">
                                    <Skeleton className="h-8 w-24 bg-emerald-400/10" />
                                    <Skeleton className="h-3 w-20 bg-emerald-400/5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subtle Brand Watermark Skeleton */}
                <div className="absolute bottom-12 right-12 opacity-[0.02]">
                    <Skeleton className="w-64 h-64 rounded-full bg-white" />
                </div>
            </div>
        </div>
    );
};

export default AuthLoading;
