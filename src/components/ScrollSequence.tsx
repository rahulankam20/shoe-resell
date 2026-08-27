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
  frameCount = 192,
  basePath = '/frames',
  prefix = 'frame_',
  pad = 3,
  format = 'webp',
  fallbackImage = '/images/solevault-hero.webp',
  alt = 'SOLEVAULT Futuristic Sneaker 360 interactive rotation',
  children,
  onProgress,
}: ScrollSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastDrawnImageRef = useRef<HTMLImageElement | null>(null);
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

  // Draw frame to canvas with high-DPI and cover scaling
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure frameIndex is within bounds
    const safeIndex = Math.min(frameCount - 1, Math.max(0, Math.floor(frameIndex)));

    // Find best available image: exact frame or nearest loaded keyframe
    const images = imagesRef.current;
    let bestImg = (images[safeIndex] && images[safeIndex].complete && images[safeIndex].naturalWidth > 0)
      ? images[safeIndex]
      : null;

    if (!bestImg) {
      for (let offset = 1; offset < frameCount; offset++) {
        const prev = images[safeIndex - offset];
        if (prev && prev.complete && prev.naturalWidth > 0) {
          bestImg = prev;
          break;
        }
        const next = images[safeIndex + offset];
        if (next && next.complete && next.naturalWidth > 0) {
          bestImg = next;
          break;
        }
      }
    }

    if (!bestImg) bestImg = images[0];
    if (!bestImg || !bestImg.complete || bestImg.naturalWidth === 0) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    // Cap DPR at 2 for silky smooth 60/120fps performance
    const effectiveDpr = Math.min(dpr, 2);
    const displayWidth = Math.round(width * effectiveDpr);
    const displayHeight = Math.round(height * effectiveDpr);

    const sizeChanged = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (sizeChanged) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    // Skip redundant redraw only if the exact same image is already drawn at the same canvas dimensions
    if (!sizeChanged && lastDrawnImageRef.current === bestImg) {
      return;
    }

    ctx.save();
    ctx.scale(effectiveDpr, effectiveDpr);

    // Compute cover scaling
    const imgWidth = bestImg.naturalWidth;
    const imgHeight = bestImg.naturalHeight;
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

    // Clear and draw frame
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bestImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    lastDrawnImageRef.current = bestImg;
  }, [frameCount]);

  // Priority-aware staged preloader
  useEffect(() => {
    let isMounted = true;
    const images: HTMLImageElement[] = new Array(frameCount);
    imagesRef.current = images;

    let loaded = 0;

    const handleSingleLoad = (img: HTMLImageElement, index: number) => {
      if (!isMounted) return;
      images[index] = img;
      loaded += 1;
      setLoadedCount(loaded);

      // Once the first frame is ready, render it immediately
      if (index === 0 && canvasRef.current) {
        drawFrame(0);
      }

      // If this loaded frame is the current target frame, update canvas
      const currentTarget = Math.min(frameCount - 1, Math.max(0, Math.round(currentFrameObjRef.current.frame)));
      if (index === currentTarget) {
        drawFrame(index);
      }

      if (loaded === frameCount) {
        setIsReady(true);
      }
    };

    const loadFrame = (i: number) => {
      if (images[i]) return;
      const img = new Image();
      img.decoding = 'async';
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
    };

    // Phase 1: First frame (critical for immediate first paint)
    loadFrame(0);

    // Phase 2: Keyframes at every ~8th frame + last frame (immediate interactive scrub)
    const keyframeInterval = 8;
    const keyframes: number[] = [];
    for (let i = keyframeInterval; i < frameCount - 1; i += keyframeInterval) {
      keyframes.push(i);
    }
    if (frameCount > 1) keyframes.push(frameCount - 1);

    const schedule = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 1);

    schedule(() => {
      if (!isMounted) return;
      for (const k of keyframes) loadFrame(k);

      // Phase 3: Fill remaining frames after keyframes
      schedule(() => {
        if (!isMounted) return;
        for (let i = 1; i < frameCount; i++) {
          if (images[i]) continue;
          loadFrame(i);
        }
      });
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, basePath, prefix, pad, format]);

  // Window resize handler
  useEffect(() => {
    const onResize = () => {
      lastDrawnImageRef.current = null; // force redraw at new size
      drawFrame(Math.round(currentFrameObjRef.current.frame));
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up GSAP ScrollTrigger synchronously in context
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
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const targetFrame = Math.min(frameCount - 1, Math.max(0, Math.round(frameObj.frame)));

            // Direct progress line transform for immediate 120fps feedback
            if (progressBarRef.current) {
              progressBarRef.current.style.transform = `scaleX(${self.progress})`;
            }

            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = requestAnimationFrame(() => {
              drawFrame(targetFrame);
              onProgress?.(self.progress);
            });
          },
        },
      });
    }, containerRef);

    // Initial measurement refresh after setup
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      ctx.revert();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, onProgress, reducedMotion]);

  // Initial paint and refresh ScrollTrigger when ready
  useEffect(() => {
    if (loadedCount > 0) {
      drawFrame(0);
      
      // Refresh ScrollTrigger after images are loaded
      if (loadedCount >= 8) { // Refresh after first keyframes are loaded
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedCount]);

  const loadPercent = Math.min(100, Math.round((loadedCount / frameCount) * 100));

  return (
    <section
      ref={containerRef}
      className="scroll-sequence"
      aria-label={alt}
      style={{ position: 'relative', height: reducedMotion ? '100vh' : '500vh', background: '#080808' }}
    >
      <div
        className="sequence-sticky"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: '#080808',
        }}
      >
        {loadError ? (
          <img
            src={fallbackImage}
            alt={alt}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
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
              zIndex: 2,
            }}
          />
        )}

        {/* Preload overlay */}
        {!isReady && !loadError && (
          <div
            style={{
              position: 'absolute',
              top: '5.5rem',
              right: '2.5vw',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fff',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'rgba(0,0,0,0.75)',
              padding: '6px 14px',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
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
            <span>Loading 360° · {loadPercent}%</span>
          </div>
        )}

        {/* Hero story content overlay */}
        {children}

        {/* Scroll sequence progress line */}
        <div className="sequence-progress" aria-hidden="true" style={{ zIndex: 12 }}>
          <span
            ref={progressBarRef}
            style={{
              transform: 'scaleX(0)',
            }}
          />
        </div>
      </div>
    </section>
  );
}
