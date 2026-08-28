import { useEffect, useRef, useState, ReactNode } from 'react';

type AnimationType = 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'blur' | 'rotate';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  once?: boolean;
}

const animationStyles: Record<AnimationType, { hidden: React.CSSProperties; visible: React.CSSProperties }> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'slide-up': {
    hidden: { opacity: 0, transform: 'translateY(60px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
  'slide-left': {
    hidden: { opacity: 0, transform: 'translateX(-80px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
  'slide-right': {
    hidden: { opacity: 0, transform: 'translateX(80px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
  scale: {
    hidden: { opacity: 0, transform: 'scale(0.85)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(12px)', transform: 'translateY(30px)' },
    visible: { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' },
  },
  rotate: {
    hidden: { opacity: 0, transform: 'rotate(-10deg) scale(0.9)' },
    visible: { opacity: 1, transform: 'rotate(0deg) scale(1)' },
  },
};

export default function AnimatedSection({
  children,
  animation = 'slide-up',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  className = '',
  once = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || (once && hasAnimated)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            setHasAnimated(true);
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once, hasAnimated]);

  const styles = animationStyles[animation];
  const transitionStyle = {
    transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s,
                 transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s,
                 filter ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...styles[isVisible ? 'visible' : 'hidden'],
        ...transitionStyle,
      }}
    >
      {children}
    </div>
  );
}

// Staggered container for multiple items
interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  animation?: AnimationType;
  className?: string;
  threshold?: number;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  animation = 'slide-up',
  className = '',
  threshold = 0.1,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              style={{
                ...animationStyles[animation][isVisible ? 'visible' : 'hidden'],
                transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerDelay}s,
                            transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerDelay}s,
                            filter 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerDelay}s`,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

// Parallax container
interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxLayer({ children, speed = 0.5, className = '' }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const scrolled = window.scrollY;
      const viewportHeight = window.innerHeight;
      const relativePosition = scrolled + viewportHeight - (rect.top + scrolled);
      const parallaxOffset = relativePosition * speed * 0.1;
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
}

// Floating element
interface FloatingElementProps {
  children: ReactNode;
  duration?: number;
  distance?: number;
  delay?: number;
  className?: string;
}

export function FloatingElement({
  children,
  duration = 6,
  distance = 15,
  delay = 0,
  className = '',
}: FloatingElementProps) {
  return (
    <div
      className={className}
      style={{
        animation: `float ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      {children}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-${distance}px) rotate(1deg); }
          75% { transform: translateY(${distance / 2}px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}

// Tilt card effect
interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  className?: string;
}

export function TiltCard({
  children,
  maxTilt = 10,
  perspective = 1000,
  scale = 1.02,
  className = '',
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const rotateX = ((mouseY - centerY) / centerY) * -maxTilt;
      const rotateY = ((mouseX - centerX) / centerX) * maxTilt;

      setTransform({ rotateX, rotateY, scale });
    };

    const handleMouseLeave = () => {
      setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    };

    const handleMouseEnter = () => {
      setTransform(prev => ({ ...prev, scale }));
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [maxTilt, scale]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `perspective(${perspective}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
}

// Counter animation
interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.round(end * eased);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
