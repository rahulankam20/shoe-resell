import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: 'up' | 'left' | 'right' | 'scale' | 'fold';
};

export default function Reveal({ children, className = '', delay = 0, from = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const style = { '--reveal-delay': `${delay}ms` } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`sv-reveal sv-reveal-${from}${visible ? ' is-in' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
