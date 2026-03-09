import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 bg-stone-200 rounded w-24"></div>
        <div className="h-5 bg-stone-200 rounded w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-stone-200 rounded w-full"></div>
        <div className="h-4 bg-stone-200 rounded w-3/4"></div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-8 bg-stone-200 rounded-lg flex-1"></div>
        <div className="h-8 bg-stone-200 rounded-lg flex-1"></div>
      </div>
    </div>
  );
};
