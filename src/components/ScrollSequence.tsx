import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollSequenceProps {
  frameCount?: number;
  basePath?: string;
  prefix?: string;
  pad?: number;
  fallbackImage: string;
  alt: string;
  children?: ReactNode;
  onProgress?: (progress: number) => void;
}

const frameName = (basePath: string, prefix: string, index: number, pad: number, format: string) => `${basePath}/${prefix}${String(index + 1).padStart(pad, '0')}.${format}`;

export default function ScrollSequence({ frameCount = 240, basePath = '/frames', prefix = 'frame-', pad = 4, fallbackImage, alt, children, onProgress }: ScrollSequenceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const loaded = useRef(new Set<string>());
  const [frame, setFrame] = useState(0);
  const [format, setFormat] = useState('webp');
  const [usingFallback, setUsingFallback] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const srcFor = useCallback((index: number, extension = format) => frameName(basePath, prefix, index, pad, extension), [basePath, prefix, pad, format]);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    setIsMobile(mobile);
    const probe = new Image();
    probe.onload = () => setFormat('avif');
    probe.onerror = () => setFormat('webp');
    probe.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxAAACAG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAHBpY3QAAAAAAAAAAAAAAA';
  }, []);

  const preload = useCallback((target: number) => {
    if (usingFallback) return;
    const radius = isMobile ? 2 : 5;
    const candidates = [target, ...Array.from({ length: radius }, (_, i) => target + i + 1), ...Array.from({ length: radius }, (_, i) => target - i - 1)];
    candidates.filter((index) => index >= 0 && index < frameCount).forEach((index) => {
      const src = srcFor(index);
      if (loaded.current.has(src)) return;
      loaded.current.add(src);
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
    });
  }, [frameCount, isMobile, srcFor, usingFallback]);

  useEffect(() => {
    const update = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const scrollable = Math.max(1, rootRef.current.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      const rawFrame = Math.round(progress * (frameCount - 1));
      const optimizedFrame = isMobile ? Math.round(rawFrame / 3) * 3 : rawFrame;
      setFrame(Math.min(frameCount - 1, optimizedFrame));
      preload(optimizedFrame);
      onProgress?.(progress);
    };
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => { update(); rafRef.current = null; });
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [frameCount, isMobile, onProgress, preload]);

  useEffect(() => {
    if (usingFallback) return;
    const warm = () => {
      const stride = isMobile ? 16 : 8;
      for (let index = 0; index < frameCount; index += stride) preload(index);
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(warm, { timeout: 1500 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }
    const timeoutId = globalThis.setTimeout(warm, 500);
    return () => globalThis.clearTimeout(timeoutId);
  }, [frameCount, isMobile, preload, usingFallback]);

  const handleError = () => {
    if (format === 'avif') { setFormat('webp'); return; }
    setUsingFallback(true);
  };

  return <section ref={rootRef} className="scroll-sequence" aria-label="SOLEVAULT cinematic collection reveal">
    <div className="sequence-sticky">
      <img className="sequence-image" src={usingFallback ? fallbackImage : srcFor(frame)} onError={handleError} alt={alt} fetchPriority="high" draggable={false} />
      <div className="sequence-vignette" aria-hidden="true" />
      {children}
      <div className="sequence-progress" aria-hidden="true"><span style={{ transform: `scaleX(${(frame + 1) / frameCount})` }} /></div>
    </div>
  </section>;
}
