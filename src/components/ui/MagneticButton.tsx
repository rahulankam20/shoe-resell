import { useRef, useState, ReactNode, ElementType, ComponentPropsWithRef } from 'react';

interface MagneticButtonProps<T extends ElementType = 'button'> {
  as?: T;
  children: ReactNode;
  strength?: number;
  className?: string;
}

export default function MagneticButton<T extends ElementType = 'button'>({
  as,
  children,
  strength = 0.25,
  className = '',
  ...props
}: MagneticButtonProps<T> & Omit<ComponentPropsWithRef<T>, keyof MagneticButtonProps<T>>) {
  const Component = as || 'button';
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * strength;
    const distanceY = (e.clientY - centerY) * strength;
    setTransform({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setTransform({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      className="magnetic-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-flex',
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: transform.x === 0 && transform.y === 0 
          ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
          : 'transform 0.1s ease-out',
        willChange: 'transform',
      }}
    >
      <Component className={className} {...(props as any)}>
        {children}
      </Component>
    </div>
  );
}
