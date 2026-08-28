import { useRef, type PointerEvent, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export default function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    node.style.setProperty('--tilt-x', `${((0.5 - y) * 10).toFixed(2)}deg`);
    node.style.setProperty('--tilt-y', `${((x - 0.5) * 12).toFixed(2)}deg`);
    node.style.setProperty('--glint-x', `${x * 100}%`);
    node.style.setProperty('--glint-y', `${y * 100}%`);
  };

  const onLeave = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty('--tilt-x', '0deg');
    node.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <div ref={ref} className={`sv-tilt ${className}`.trim()} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  );
}
