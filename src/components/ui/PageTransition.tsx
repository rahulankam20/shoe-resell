import { useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Animate page entrance
    if (pageRef.current) {
      pageRef.current.style.opacity = '0';
      pageRef.current.style.transform = 'translateY(20px)';
      
      requestAnimationFrame(() => {
        if (pageRef.current) {
          pageRef.current.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          pageRef.current.style.opacity = '1';
          pageRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, [location.pathname]);

  return (
    <div ref={pageRef} className="page-transition-wrapper">
      {children}
    </div>
  );
}

// Animated counter component
interface CounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '',
  decimals = 0 
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const startTime = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateValue();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration]);

  const animateValue = () => {
    const element = ref.current;
    if (!element) return;

    const animate = (currentTime: number) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }

      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = eased * end;

      element.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return <span ref={ref}>{prefix}{(0).toFixed(decimals)}{suffix}</span>;
}

// Typewriter effect
interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({ text, speed = 50, delay = 0, className = '' }: TypewriterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasStarted.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          startTyping();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [text, speed, delay]);

  const startTyping = () => {
    const element = ref.current;
    if (!element) return;

    let index = 0;
    element.textContent = '';

    const timeout = setTimeout(() => {
      const type = () => {
        if (index < text.length) {
          element.textContent = text.slice(0, index + 1);
          index++;
          setTimeout(type, speed);
        }
      };
      type();
    }, delay);
  };

  return <span ref={ref} className={className} />;
}

// Parallax scroll component
interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.5, className = '' }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const scrolled = window.scrollY;
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top + scrolled;
      const relativePosition = scrolled + viewportHeight - elementTop;
      const offset = relativePosition * speed * 0.1;
      
      element.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}

// Scroll progress indicator
export function ScrollProgress({ color = 'var(--accent)' }: { color?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      
      if (ref.current) {
        ref.current.style.width = `${scrolled}%`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: '101px',
        left: 0,
        height: '2px',
        background: `linear-gradient(90deg, ${color}, var(--ink))`,
        zIndex: 100,
        width: '0%',
        transition: 'width 0.1s linear',
      }}
    />
  );
}

// Magnetic button wrapper
interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({ children, strength = 0.3, className = '' }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    element.style.transform = `translate(${distanceX * strength}px, ${distanceY * strength}px)`;
  };

  const handleMouseLeave = () => {
    const element = ref.current;
    if (!element) return;
    
    element.style.transform = 'translate(0, 0)';
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {children}
    </div>
  );
}

// Tilt effect for cards
interface TiltProps {
  children: ReactNode;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  className?: string;
}

export function Tilt({ 
  children, 
  maxTilt = 10, 
  perspective = 1000, 
  scale = 1.02,
  className = '' 
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotateX = ((mouseY - centerY) / centerY) * -maxTilt;
    const rotateY = ((mouseX - centerX) / centerX) * maxTilt;

    element.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
  };

  const handleMouseLeave = () => {
    const element = ref.current;
    if (!element) return;
    
    element.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
}

// Floating animation wrapper
interface FloatingProps {
  children: ReactNode;
  duration?: number;
  distance?: number;
  delay?: number;
  className?: string;
}

export function Floating({ 
  children, 
  duration = 6, 
  distance = 15, 
  delay = 0,
  className = '' 
}: FloatingProps) {
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

// Smooth scroll to element
export function useSmoothScroll() {
  const scrollTo = (elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    
    window.scrollTo({
      top,
      behavior: 'smooth',
    });
  };

  return scrollTo;
}

// Intersection observer hook for animations
export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible: isVisible.current };
}
