import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  onClick,
  hover = false
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };
  
  const baseClasses = "bg-white rounded-2xl border border-stone-100 shadow-sm transition-all";
  const hoverClasses = hover ? "hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 cursor-pointer" : "";
  
  return (
    <div 
      className={`${baseClasses} ${paddings[padding]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
