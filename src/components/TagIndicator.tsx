import React from 'react';

interface TagIndicatorProps {
  className?: string;
  text?: string;
}

export const TagIndicator: React.FC<TagIndicatorProps> = ({ className = "", text = "" }) => {
  return (
    <span 
      className={`w-8 h-8 p-2 bg-white/40 backdrop-blur-2xl backdrop-saturate-150 shadow-md rounded-lg text-xs text-black ${className}`}
    >
      {text}
    </span>
  );
}; 