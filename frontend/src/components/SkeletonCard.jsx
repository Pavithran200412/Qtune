import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3 w-full max-w-[210px] animate-pulse">
      {/* Artwork Box */}
      <div className="aspect-square w-full bg-slate-800 rounded-xl"></div>
      
      {/* Title block */}
      <div className="h-3 w-3/4 bg-slate-800 rounded mt-1"></div>
      
      {/* Artist block */}
      <div className="h-2 w-1/2 bg-slate-800 rounded"></div>
      
      {/* Tag and button row */}
      <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
        <div className="h-4 w-12 bg-slate-800 rounded-full"></div>
        <div className="flex gap-2">
          <div className="h-6 w-6 bg-slate-800 rounded-lg"></div>
          <div className="h-6 w-6 bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
