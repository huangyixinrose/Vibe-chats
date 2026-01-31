import React from 'react';

interface AvatarProps {
  src: string;
  alt: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, color, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  const borderColor = color ? { borderColor: color } : {};

  return (
    <div 
      className={`rounded-full overflow-hidden border-2 flex-shrink-0 bg-slate-700 ${sizeClasses[size]} ${className}`}
      style={borderColor}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback if image fails
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
          e.currentTarget.parentElement!.innerText = alt.slice(0, 2).toUpperCase();
        }}
      />
    </div>
  );
};

export default Avatar;