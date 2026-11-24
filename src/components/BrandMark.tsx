import React from 'react';

interface BrandMarkProps {
  compact?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ compact = false }) => {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      {/* Emblema geométrico de taller: marco biselado con cuña de precisión */}
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="7"
          className="fill-[var(--text-primary)]"
        />
        <path
          d="M10.5 9.5H17.5C20.2614 9.5 22.5 11.7386 22.5 14.5C22.5 17.2614 20.2614 19.5 17.5 19.5H13.5V23.5H10.5V9.5Z"
          className="fill-[var(--bg-surface)]"
        />
        <circle cx="17.2" cy="14.5" r="2.2" className="fill-[var(--accent)]" />
        <path
          d="M17.5 22.5L22.5 17.5"
          stroke="var(--accent)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      {!compact && (
        <span className="text-[17px] font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">
          Presta<span className="text-[var(--accent)]">Herramienta</span>
        </span>
      )}
    </span>
  );
};
