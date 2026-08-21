import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  active?: boolean;
}

export function AnimatedSearch({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`itshover-icon itshover-search ${className}`}
      {...props}
    >
      <circle cx="11" cy="11" r="8" className="itshover-lens" />
      <path d="m21 21-4.35-4.35" className="itshover-handle" />
    </svg>
  );
}

export function AnimatedBag({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`itshover-icon itshover-bag ${className}`}
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" className="itshover-bag-body" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" className="itshover-bag-handle" />
    </svg>
  );
}

export function AnimatedHeart({ size = 20, active = false, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`itshover-icon itshover-heart ${active ? 'is-active' : ''} ${className}`}
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function AnimatedUser({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`itshover-icon itshover-user ${className}`}
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" className="itshover-user-body" />
      <circle cx="12" cy="7" r="4" className="itshover-user-head" />
    </svg>
  );
}

export function AnimatedArrowRight({ size = 16, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`itshover-icon itshover-arrow ${className}`}
      {...props}
    >
      <path d="M5 12h14" className="itshover-arrow-shaft" />
      <path d="m12 5 7 7-7 7" className="itshover-arrow-head" />
    </svg>
  );
}

export function AnimatedClose({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`itshover-icon itshover-close ${className}`}
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function AnimatedPlus({ size = 16, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`itshover-icon itshover-plus ${className}`}
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function AnimatedFilter({ size = 18, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`itshover-icon itshover-filter ${className}`}
      {...props}
    >
      <line x1="4" x2="20" y1="21" y2="21" />
      <line x1="4" x2="20" y1="14" y2="14" />
      <line x1="4" x2="20" y1="7" y2="7" />
      <circle cx="8" cy="7" r="2" className="itshover-filter-knob1" />
      <circle cx="16" cy="14" r="2" className="itshover-filter-knob2" />
      <circle cx="10" cy="21" r="2" className="itshover-filter-knob3" />
    </svg>
  );
}
