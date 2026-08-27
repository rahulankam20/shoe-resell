import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

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
  alt = 'SOLEVAULT 360° Interactive Sneaker Experience',
  children,
  onProgress,
}: ScrollSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressLineRef = useRef<HTMLSpanElement>(null);

  // References to keep RAF loop completely independent of React render cycle
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const currentProgressRef = useRef<number>(0);
  const targetProgressRef = useRef<number>(0);
  const lastDrawnImageRef = useRef<HTMLImageElement | null>(null);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartProgressRef = useRef(0);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── High-DPI Cover-Scaling Canvas Renderer ──────────────────────────
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const images = imagesRef.current;
    const boundedIndex = Math.min(frameCount - 1, Math.max(0, Math.round(frameIndex)));

    // 1. Pick exact frame or find nearest available keyframe
    let img = images[boundedIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let offset = 1; offset < frameCount; offset++) {
        const prev = images[boundedIndex - offset];
        if (prev && prev.complete && prev.naturalWidth > 0) {
          img = prev;
          break;
        }
        const next = images[boundedIndex + offset];
        if (next && next.complete && next.naturalWidth > 0) {
          img = next;
          break;
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) {
      img = images[0];
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);

    const sizeChanged = canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (sizeChanged) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    // Skip redundant redraw only if same image at same dimensions
    if (!sizeChanged && lastDrawnImageRef.current === img) {
      return;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Compute aspect-ratio cover positioning
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

    // High quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear and draw image
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    lastDrawnImageRef.current = img;
  }, [frameCount]);

  // ── Multi-Stage Priority Frame Preloader ─────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const images: (HTMLImageElement | null)[] = new Array(frameCount).fill(null);
    imagesRef.current = images;

    let loaded = 0;

    const handleSingleLoad = (img: HTMLImageElement, index: number) => {
      if (!isMounted) return;
      images[index] = img;
      loaded += 1;
      setLoadedCount(loaded);

      // Render frame 0 immediately on first load
      if (index === 0) {
        drawFrame(0);
      }

      // If this loaded frame is near current progress, refresh canvas
      const currentTarget = Math.min(frameCount - 1, Math.max(0, Math.round(currentProgressRef.current * (frameCount - 1))));
      if (Math.abs(index - currentTarget) <= 2) {
        drawFrame(currentTarget);
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

    // Stage 1: First frame (instant paint)
    loadFrame(0);

    // Stage 2: Keyframes every 6th frame (gives instant smooth 360° rotation)
    const keyframeInterval = 6;
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

      // Stage 3: Load all remaining frames
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
  }, [frameCount, basePath, prefix, pad, format, drawFrame]);

  // ── Bulletproof Scroll Calculation & Animation Loop ─────────────────
  useEffect(() => {
    if (reducedMotion) return;

    let animId: number;

    const computeProgressFromScroll = () => {
      if (isDraggingRef.current) return;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable <= 0) {
        targetProgressRef.current = 0;
        return;
      }

      // rect.top goes from 0 (when section hits viewport top) to -totalScrollable (when bottom hits viewport)
      const rawProgress = -rect.top / totalScrollable;
      targetProgressRef.current = Math.max(0, Math.min(1, rawProgress));
    };

    // Continuous 60/120fps RAF loop with smooth lerp interpolation
    const tick = () => {
      computeProgressFromScroll();

      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const diff = target - current;

      // Smooth damping (lerp factor 0.22 for responsive snappy feel)
      if (Math.abs(diff) > 0.0002) {
        currentProgressRef.current += diff * 0.22;
      } else {
        currentProgressRef.current = target;
      }

      const p = currentProgressRef.current;
      const targetFrame = Math.min(frameCount - 1, Math.max(0, Math.round(p * (frameCount - 1))));

      // Draw canvas frame
      drawFrame(targetFrame);

      // Notify parent component for UI telemetry (compass, badges, chapters)
      onProgressRef.current?.(p);

      // Update hardware-accelerated progress line
      if (progressLineRef.current) {
        progressLineRef.current.style.transform = `scaleX(${p})`;
      }

      animId = requestAnimationFrame(tick);
    };

    // Listen to all scroll and wheel events
    window.addEventListener('scroll', computeProgressFromScroll, { passive: true });
    window.addEventListener('resize', computeProgressFromScroll, { passive: true });

    // Start loop
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', computeProgressFromScroll);
      window.removeEventListener('resize', computeProgressFromScroll);
    };
  }, [frameCount, drawFrame, reducedMotion]);

  // ── Interactive Mouse & Touch Drag Scrubbing ──────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartProgressRef.current = currentProgressRef.current;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const sensitivity = 0.0022; // smooth scrub distance
    const newProgress = Math.max(0, Math.min(1, dragStartProgressRef.current + deltaX * sensitivity));
    targetProgressRef.current = newProgress;
    currentProgressRef.current = newProgress;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const loadPercent = Math.min(100, Math.round((loadedCount / frameCount) * 100));

  return (
    <section
      ref={containerRef}
      className="scroll-sequence"
      aria-label={alt}
      style={{
        position: 'relative',
        height: reducedMotion ? '100vh' : '400vh',
        background: '#080808',
      }}
    >
      <div
        className="sequence-sticky"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: '#080808',
          cursor: 'grab',
          touchAction: 'pan-y',
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

        {/* Loading status badge */}
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
              pointerEvents: 'none',
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
            <span>360° Ready · {loadPercent}%</span>
          </div>
        )}

        {/* Story Overlay Layer */}
        {children}

        {/* Interactive Scrub Cue */}
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            right: '3vw',
            zIndex: 15,
            color: 'rgba(255,255,255,0.5)',
            fontSize: '9px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
          }}
        >
          <span>Scroll or Drag to Rotate 360°</span>
        </div>

        {/* Scroll Sequence Progress Line */}
        <div
          className="sequence-progress"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '3vw',
            right: '3vw',
            bottom: '18px',
            height: '1px',
            background: 'rgba(255,255,255,0.25)',
            zIndex: 12,
          }}
        >
          <span
            ref={progressLineRef}
            style={{
              display: 'block',
              height: '100%',
              background: '#ff4d23',
              transformOrigin: 'left',
              transform: 'scaleX(0)',
              transition: 'none',
            }}
          />
        </div>
      </div>
    </section>
  );
}
