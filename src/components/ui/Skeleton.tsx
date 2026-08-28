import { useEffect, useRef, useState } from 'react';

/**
 * Skeleton loader for product cards
 */
export function ProductSkeleton() {
  return (
    <div className="product-skeleton">
      <div className="skeleton-media">
        <div className="skeleton-shimmer" />
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-eyebrow" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-category" />
        <div className="skeleton-line skeleton-price" />
      </div>
      <style>{`
        .product-skeleton {
          min-width: 0;
        }

        .skeleton-media {
          position: relative;
          background: #e8e8e8;
          aspect-ratio: 0.83;
          border-radius: 4px;
          overflow: hidden;
        }

        .skeleton-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }

        .skeleton-content {
          padding: 1rem 0.1rem 1.5rem;
        }

        .skeleton-line {
          background: #e8e8e8;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .skeleton-line::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
        }

        .skeleton-eyebrow {
          width: 60px;
          height: 10px;
        }

        .skeleton-title {
          width: 80%;
          height: 16px;
        }

        .skeleton-category {
          width: 50%;
          height: 10px;
        }

        .skeleton-price {
          width: 70px;
          height: 14px;
          margin-top: 0.8rem;
        }
      `}</style>
    </div>
  );
}

/**
 * Skeleton loader for brand cards
 */
export function BrandSkeleton() {
  return (
    <div className="brand-skeleton">
      <div className="skeleton-brand-media">
        <div className="skeleton-shimmer" />
      </div>
      <div className="skeleton-brand-overlay">
        <div className="skeleton-line skeleton-brand-number" />
        <div className="skeleton-line skeleton-brand-title" />
        <div className="skeleton-line skeleton-brand-count" />
      </div>
      <style>{`
        .brand-skeleton {
          position: relative;
          height: min(60vh, 600px);
          background: #161616;
          overflow: hidden;
        }

        .skeleton-brand-media {
          position: absolute;
          inset: 0;
          background: #222;
        }

        .skeleton-brand-overlay {
          position: absolute;
          inset: 0;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: end;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.8), transparent 65%);
        }

        .skeleton-brand-number {
          width: 30px;
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
          margin-bottom: 1rem;
        }

        .skeleton-brand-title {
          width: 60%;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          margin-bottom: 0.5rem;
        }

        .skeleton-brand-count {
          width: 40%;
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

/**
 * Skeleton loader for text content
 */
export function TextSkeleton({ 
  lines = 3, 
  lineHeight = 16,
  lastLineWidth = '60%' 
}: { 
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string;
}) {
  return (
    <div className="text-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-text-line"
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
            height: lineHeight,
            animationDelay: `${i * 100}ms`,
          }}
        />
      ))}
      <style>{`
        .text-skeleton {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .skeleton-text-line {
          background: #e8e8e8;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .skeleton-text-line::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

/**
 * Loading spinner with animation
 */
export function LoadingSpinner({ 
  size = 40, 
  color = 'var(--accent)' 
}: { 
  size?: number;
  color?: string;
}) {
  return (
    <div 
      className="loading-spinner"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 50 50" style={{ width: '100%', height: '100%' }}>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            strokeDasharray: '80, 200',
            strokeDashoffset: 0,
            animation: 'spinner-dash 1.5s ease-in-out infinite',
          }}
        />
      </svg>
      <style>{`
        .loading-spinner {
          display: inline-block;
        }

        @keyframes spinner-dash {
          0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Progressive image loader with blur effect
 */
export function ProgressiveImage({ 
  src, 
  alt, 
  placeholder,
  className = '' 
}: { 
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoaded(true);
    };
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} ${loaded ? 'loaded' : 'loading'}`}
      style={{
        filter: loaded ? 'none' : 'blur(10px)',
        transition: 'filter 0.3s ease',
      }}
    />
  );
}

/**
 * Intersection observer based lazy loader
 */
export function LazyLoad({ 
  children, 
  threshold = 0.1,
  rootMargin = '50px',
  placeholder 
}: { 
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  placeholder?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : placeholder || null}
    </div>
  );
}
