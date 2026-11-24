import React, { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';

interface ToolImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const ToolImage: React.FC<ToolImageProps> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-[var(--bg-subtle)] text-[var(--text-muted)] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Wrench className="h-8 w-8 opacity-50" strokeWidth={1.6} />
        <span className="max-w-[80%] truncate px-3 text-xs font-medium">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
