import React from 'react';
import Skeleton from './Skeleton';

const SkeletonLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar Skeleton */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <Skeleton className="h-8 w-8 mr-2 rounded-full" />
                    <Skeleton className="h-6 w-32 rounded" />
                </div>
                <div className="flex-1 p-4 space-y-4">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header Skeleton */}
            <header className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </div>
            </header>

            {/* Main Content Skeleton */}
            <main className="flex-1 md:ml-64 pt-16 md:pt-0 p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-12 w-full md:w-32 rounded-lg" />
                    </div>

                    {/* Stats or Action Area */}
                    <div className="flex gap-4">
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </div>

                    {/* Task List Skeleton */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-5 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex justify-between items-start">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SkeletonLayout;
