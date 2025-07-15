import React from 'react';

interface TagIndicatorProps {
  className?: string;
  text?: string;
}

export const TagIndicator: React.FC<TagIndicatorProps> = ({ className = "", text = "" }) => {
  return (
    <div
        className={`
          inline-flex items-center justify-center
          min-w-6 h-6 px-2
          bg-primary/10 text-primary
          border border-primary/20
          rounded-full
          text-xs font-medium
          shadow-sm
          backdrop-blur-sm
          transition-all duration-200
          hover:bg-primary/15 hover:border-primary/30
          ${className}
        `}
        title={text}
    >
      {text}
    </div>
  );
}; 