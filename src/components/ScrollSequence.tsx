import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollSequenceProps {
  frameCount?: number;
  basePath?: string;
  prefix?: string;
  pad?: number;
  format?: string;
  fallbackImage?: string;
  alt?: string;
  children?: ReactNode;
  onProgress?: (progress: number) => void;
}

const getFrameUrl = (basePath: string, prefix: string, index: number, pad: number, format: string) => {
  const frameNum = String(index + 1).padStart(pad, '0');
  return `${basePath}/${prefix}${frameNum}.${format}`;
};

export default function ScrollSequence({
  frameCount = 240,
  basePath = '/frames',
  prefix = 'ezgif-frame-',
  pad = 3,
  format = 'jpg',
  fallbackImage = '/images/solevault-hero.webp',
  alt = 'SOLEVAULT Sneaker 360 interactive rotation',
  children,
  onProgress,
}: ScrollSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnIndexRef = useRef<number>(-1);
  const currentFrameObjRef = useRef<{ frame: number }>({ frame: 0 });
  const rafIdRef = useRef<number | null>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Preload and decode all frames
  useEffect(() => {
    let isMounted = true;
    const images: HTMLImageElement[] = [];
    imagesRef.current = images;

    let loaded = 0;

    const handleSingleLoad = (img: HTMLImageElement, index: number) => {
      if (!isMounted) return;
      images[index] = img;
      loaded += 1;
      setLoadedCount(loaded);

      // Once the first frame is ready, we can immediately render it
      if (index === 0 && canvasRef.current) {
        drawFrame(0);
      }

      if (loaded === frameCount) {
        setIsReady(true);
      }
    };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = getFrameUrl(basePath, prefix, i, pad, format);

      img.onload = () => {
        if ('decode' in img && typeof img.decode === 'function') {
          img.decode()
            .then(() => handleSingleLoad(img, i))
            .catch(() => handleSingleLoad(img, i));
        } else {
          handleSingleLoad(img, i);
        }
      };

      img.onerror = () => {
        if (i === 0) setLoadError(true);
        handleSingleLoad(img, i);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [frameCount, basePath, prefix, pad, format]);

  // Draw frame to canvas with cover scaling
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = imagesRef.current[frameIndex] || imagesRef.current[0];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    if (lastDrawnIndexRef.current === frameIndex && canvas.width > 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Compute cover scaling
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = width / height;

    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (canvasRatio > imgRatio) {
      drawW = width;
      drawH = width / imgRatio;
      drawX = 0;
      drawY = (height - drawH) / 2;
    } else {
      drawH = height;
      drawW = height * imgRatio;
      drawX = (width - drawW) / 2;
      drawY = 0;
    }

    // Clear and draw
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    lastDrawnIndexRef.current = frameIndex;
  }, []);

  // Window resize handler
  useEffect(() => {
    const onResize = () => {
      lastDrawnIndexRef.current = -1; // force redraw
      drawFrame(currentFrameObjRef.current.frame);
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [drawFrame]);

  // Set up GSAP ScrollTrigger
  useEffect(() => {
    if (!containerRef.current || reducedMotion) return;

    const container = containerRef.current;
    const frameObj = currentFrameObjRef.current;

    const ctx = gsap.context(() => {
      gsap.to(frameObj, {
        frame: frameCount - 1,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (self) => {
            const targetFrame = Math.min(frameCount - 1, Math.max(0, Math.round(frameObj.frame)));
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

            rafIdRef.current = requestAnimationFrame(() => {
              drawFrame(targetFrame);
              onProgress?.(self.progress);
            });
          },
        },
      });
    }, containerRef);

    return () => {
      ctx.revert();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [frameCount, drawFrame, onProgress, reducedMotion, isReady]);

  // Initial paint
  useEffect(() => {
    drawFrame(0);
  }, [isReady, drawFrame]);

  const loadPercent = Math.min(100, Math.round((loadedCount / frameCount) * 100));

  return (
    <section
      ref={containerRef}
      className="scroll-sequence"
      aria-label={alt}
      style={{ position: 'relative', height: reducedMotion ? '100vh' : '400vh', background: '#080808' }}
    >
      <div className="sequence-sticky" style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', background: '#080808' }}>
        {loadError ? (
          <img
            src={fallbackImage}
            alt={alt}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="sequence-canvas"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Preload overlay */}
        {!isReady && !loadError && (
          <div
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2.5vw',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'rgba(0,0,0,0.7)',
              padding: '6px 12px',
              borderRadius: '20px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: '2px solid #ff4d23',
                borderTopColor: 'transparent',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span>Loading Vault · {loadPercent}%</span>
          </div>
        )}

        {/* Hero content overlay */}
        {children}

        {/* Scroll sequence progress line */}
        <div className="sequence-progress" aria-hidden="true">
          <span
            style={{
              transform: `scaleX(${isReady ? (currentFrameObjRef.current.frame + 1) / frameCount : loadPercent / 100})`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
