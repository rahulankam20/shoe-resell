import { useEffect, useRef, useState } from 'react';

/**
 * Animated gradient orbs that float in the background
 */
export function GradientOrbs() {
  return (
    <div className="gradient-orbs-container" aria-hidden="true">
      <div className="gradient-orb orb-1" />
      <div className="gradient-orb orb-2" />
      <div className="gradient-orb orb-3" />
    </div>
  );
}

/**
 * Particle field that responds to mouse movement
 */
export function ParticleField({ count = 30 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="particle-field" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            transform: `translate(${mousePosition.x * (10 + Math.random() * 20)}px, ${mousePosition.y * (10 + Math.random() * 20)}px)`,
            transitionDelay: `${i * 20}ms`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Animated noise overlay for texture
 */
export function NoiseOverlay() {
  return <div className="noise-overlay" aria-hidden="true" />;
}

/**
 * Animated section divider
 */
export function AnimatedDivider({ type = 'gradient' }: { type?: 'gradient' | 'dots' | 'line' }) {
  if (type === 'dots') {
    return (
      <div className="divider-dots" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="divider-dot" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="divider-line" aria-hidden="true">
        <div className="line-fill" />
      </div>
    );
  }

  return (
    <div className="divider-gradient" aria-hidden="true">
      <div className="gradient-fill" />
    </div>
  );
}

/**
 * Scroll-triggered progress indicator for sections
 */
export function SectionProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / documentHeight) * 100;
      setProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="section-progress"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}

/**
 * Animated marquee text
 */
export function MarqueeText({ 
  children, 
  speed = 20, 
  direction = 'left' 
}: { 
  children: React.ReactNode; 
  speed?: number;
  direction?: 'left' | 'right';
}) {
  return (
    <div className="marquee-container" aria-hidden="true">
      <div
        className="marquee-content"
        style={{
          animation: `marquee ${speed}s linear infinite ${direction === 'right' ? 'reverse' : 'normal'}`,
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

/**
 * Animated border that follows mouse
 */
export function GlowBorder({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    element.addEventListener('mousemove', handleMouseMove);
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={ref} className="glow-border-container">
      <div
        className="glow-effect"
        style={{
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, rgba(255, 77, 35, 0.15), transparent 50%)`,
        }}
      />
      {children}
    </div>
  );
}

/**
 * Animated text reveal on scroll
 */
export function TextReveal({ 
  text, 
  className = '' 
}: { 
  text: string; 
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={`text-reveal ${className}`}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="reveal-char"
          style={{
            animationDelay: `${i * 0.03}s`,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

/**
 * Animated counter that counts up when visible
 */
export function CountUp({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '' 
}: { 
  end: number; 
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animate = () => {
    const startTime = performance.now();
    
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.round(eased * end));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  };

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/**
 * Cursor follower effect
 */
export function CursorFollower({ 
  size = 20, 
  color = 'var(--accent)' 
}: { 
  size?: number;
  color?: string;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, [data-cursor-hover]')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <div
      className="cursor-follower"
      style={{
        width: isHovering ? size * 2 : size,
        height: isHovering ? size * 2 : size,
        left: position.x,
        top: position.y,
        borderColor: color,
        background: isHovering ? `${color}22` : 'transparent',
      }}
      aria-hidden="true"
    />
  );
}

const styles = `
  .gradient-orbs-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: -1;
    overflow: hidden;
  }

  .gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
  }

  .orb-1 {
    width: 600px;
    height: 600px;
    background: linear-gradient(135deg, var(--accent), transparent);
    top: -200px;
    right: -200px;
    animation: float-orb 20s ease-in-out infinite;
  }

  .orb-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, var(--ink), transparent);
    bottom: -100px;
    left: -100px;
    animation: float-orb 25s ease-in-out infinite reverse;
  }

  .orb-3 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, var(--accent), var(--ink));
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulse-orb 15s ease-in-out infinite;
  }

  @keyframes float-orb {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(50px, -30px) scale(1.1); }
    50% { transform: translate(-30px, 50px) scale(0.95); }
    75% { transform: translate(30px, 30px) scale(1.05); }
  }

  @keyframes pulse-orb {
    0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.2); }
  }

  .particle-field {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: -1;
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--accent);
    border-radius: 50%;
    opacity: 0.2;
    transition: transform 0.3s ease-out;
  }

  .noise-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9998;
    opacity: 0.015;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }

  .divider-dots {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 0;
  }

  .divider-dot {
    width: 8px;
    height: 8px;
    background: var(--accent);
    border-radius: 50%;
    animation: dot-pulse 1s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.7; }
  }

  .divider-line {
    height: 1px;
    background: var(--line);
    margin: 3rem 0;
    overflow: hidden;
  }

  .line-fill {
    height: 100%;
    width: 0%;
    background: var(--accent);
    animation: line-fill 1s ease-out forwards;
  }

  @keyframes line-fill {
    from { width: 0%; }
    to { width: 100%; }
  }

  .divider-gradient {
    height: 2px;
    margin: 3rem 0;
    overflow: hidden;
  }

  .gradient-fill {
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    background-size: 200% 100%;
    animation: gradient-slide 3s linear infinite;
  }

  @keyframes gradient-slide {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  .section-progress {
    position: fixed;
    top: 101px;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--ink));
    z-index: 100;
    transition: width 0.1s linear;
  }

  .marquee-container {
    overflow: hidden;
    white-space: nowrap;
  }

  .marquee-content {
    display: inline-flex;
    animation: marquee 20s linear infinite;
  }

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .glow-border-container {
    position: relative;
    overflow: hidden;
  }

  .glow-effect {
    position: absolute;
    inset: 0;
    pointer-events: none;
    transition: background 0.2s ease;
  }

  .text-reveal {
    display: inline-block;
    overflow: hidden;
  }

  .reveal-char {
    display: inline-block;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .cursor-follower {
    position: fixed;
    border: 1px solid var(--accent);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: width 0.2s ease, height 0.2s ease, background 0.2s ease;
  }

  @media (max-width: 768px) {
    .cursor-follower {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .gradient-orb,
    .particle,
    .divider-dot,
    .gradient-fill,
    .marquee-content {
      animation: none !important;
    }
    
    .reveal-char {
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
