import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 192;
const FRAME_BASE = '/frames';
const FRAME_PREFIX = 'frame_';
const FRAME_EXT = 'webp';
const DPR_CAP = 2;
const LOAD_CONCURRENCY = 6;
const SCRUB_SMOOTHING = 0.75;

const chapters = [
  {
    at: 0,
    number: '01',
    eyebrow: '01 / The Reveal',
    title: 'Not just seen. Introduced.',
    body: 'A pair enters the frame like an archive object: shape first, details second, hype last.',
    action: 'Begin the inspection',
    motion: 'rise',
  },
  {
    at: 0.34,
    number: '02',
    eyebrow: '02 / The Proof',
    title: 'Details do the talking.',
    body: 'Stitch rhythm, texture, structure, colorway: the rotation becomes evidence, not decoration.',
    action: 'Read the build',
    motion: 'slide',
  },
  {
    at: 0.67,
    number: '03',
    eyebrow: '03 / The Unlock',
    title: 'Verified. Priced. Yours.',
    body: 'The noise falls away. What remains is original footwear, clean value, and a pair ready to leave the vault.',
    action: 'Enter the vault',
    motion: 'cut',
  },
];

const frameUrl = (index: number) => {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `${FRAME_BASE}/${FRAME_PREFIX}${frameNumber}.${FRAME_EXT}`;
};

const getChapterIndex = (progress: number) => {
  let active = 0;
  for (let index = 0; index < chapters.length; index += 1) {
    if (progress >= chapters[index].at) active = index;
  }
  return active;
};

const decodeImage = async (image: HTMLImageElement) => {
  if ('decode' in image) {
    try {
      await image.decode();
      return;
    } catch {
      // Fall back to onload state below. Some browsers reject decode for cached images.
    }
  }

  if (image.complete && image.naturalWidth > 0) return;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not load ${image.src}`));
  });
};

const drawCover = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  cssWidth: number,
  cssHeight: number,
) => {
  const context = canvas.getContext('2d');
  if (!context || cssWidth <= 0 || cssHeight <= 0) return;

  const scale = Math.max(cssWidth / image.naturalWidth, cssHeight / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const offsetX = (cssWidth - drawWidth) / 2;
  const offsetY = (cssHeight - drawHeight) / 2;

  context.clearRect(0, 0, cssWidth, cssHeight);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

export default function HeroScrollExperience() {
  const rootRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const frameCache = useRef(new Map<number, HTMLImageElement>());
  const loadQueue = useRef(new Set<number>());
  const lastDrawnFrame = useRef(-1);
  const targetFrame = useRef(0);
  const refreshTimer = useRef<number | null>(null);
  const idleHandle = useRef<number | null>(null);
  const fallbackIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const chapter = chapters[chapterIndex];

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const sticky = stickyRef.current;
    const root = rootRef.current;
    const copy = copyRef.current;
    let activeLoads = 0;

    if (!canvas || !sticky || !root) return undefined;

    const scheduleRefresh = () => {
      if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    };

    const drawFrame = (index: number) => {
      const image = frameCache.current.get(index);
      if (!image || lastDrawnFrame.current === index) return;

      const width = sticky.clientWidth;
      const height = sticky.clientHeight;
      drawCover(canvas, image, width, height);
      lastDrawnFrame.current = index;
    };

    const resizeCanvas = () => {
      const width = sticky.clientWidth;
      const height = sticky.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext('2d');
      if (context) context.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawnFrame.current = -1;
      drawFrame(targetFrame.current);
      scheduleRefresh();
    };

    const loadFrame = async (index: number) => {
      if (frameCache.current.has(index)) return frameCache.current.get(index);

      const image = new Image();
      image.decoding = 'async';
      image.src = frameUrl(index);
      await decodeImage(image);

      if (!cancelled) {
        frameCache.current.set(index, image);
        if (index === targetFrame.current || lastDrawnFrame.current < 0) drawFrame(index);
      }

      return image;
    };

    const pumpQueue = () => {
      if (cancelled) return;

      while (activeLoads < LOAD_CONCURRENCY && loadQueue.current.size > 0) {
        const [index] = loadQueue.current;
        loadQueue.current.delete(index);
        if (frameCache.current.has(index)) continue;

        activeLoads += 1;
        loadFrame(index)
          .catch(() => undefined)
          .finally(() => {
            activeLoads -= 1;
            pumpQueue();
          });
      }
    };

    const queueFrame = (index: number) => {
      if (index < 0 || index >= FRAME_COUNT || frameCache.current.has(index)) return;
      loadQueue.current.add(index);
      pumpQueue();
    };

    const queueProgressiveFrames = () => {
      const priorityFrames = [0, 24, 48, 72, 96, 120, 144, 168, 191];
      priorityFrames.forEach(queueFrame);

      const enqueueRest = () => {
        for (let index = 0; index < FRAME_COUNT; index += 1) queueFrame(index);
      };

      if (typeof window.requestIdleCallback === 'function') {
        idleHandle.current = window.requestIdleCallback(enqueueRest, { timeout: 1400 });
      } else {
        fallbackIdleTimer.current = setTimeout(enqueueRest, 400);
      }
    };

    const renderToProgress = (progress: number) => {
      const nextFrame = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(progress * (FRAME_COUNT - 1))));
      targetFrame.current = nextFrame;
      queueFrame(nextFrame);
      queueFrame(nextFrame + 1);
      queueFrame(nextFrame - 1);
      drawFrame(nextFrame);

      const nextChapter = getChapterIndex(progress);
      setChapterIndex((current) => (current === nextChapter ? current : nextChapter));

      root.style.setProperty('--hse-progress', `${progress}`);
    };

    const bodyObserver = new ResizeObserver(scheduleRefresh);
    const stickyObserver = new ResizeObserver(resizeCanvas);

    resizeCanvas();
    loadFrame(0)
      .then(() => {
        if (!cancelled) {
          drawFrame(0);
          setReady(true);
        }
      })
      .catch(() => undefined)
      .finally(queueProgressiveFrames);

    let context: gsap.Context | undefined;

    context = gsap.context(() => {
      const playhead = { progress: 0 };

      if (copy) {
        gsap.fromTo(copy, { y: 22, opacity: 0.86 }, {
          y: -26,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: SCRUB_SMOOTHING,
          },
        });
      }

      gsap.to(playhead, {
        progress: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: SCRUB_SMOOTHING,
          invalidateOnRefresh: true,
          onUpdate: (self) => renderToProgress(self.progress),
        },
      });
    }, root);

    bodyObserver.observe(document.body);
    stickyObserver.observe(sticky);
    scheduleRefresh();

    document.fonts?.ready.then(scheduleRefresh).catch(() => undefined);
    window.setTimeout(() => ScrollTrigger.refresh(), 450);

    return () => {
      cancelled = true;
      context?.revert();
      bodyObserver.disconnect();
      stickyObserver.disconnect();
      loadQueue.current.clear();

      if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
      if (idleHandle.current !== null) {
        window.cancelIdleCallback?.(idleHandle.current);
        idleHandle.current = null;
      }

      if (fallbackIdleTimer.current !== null) {
        clearTimeout(fallbackIdleTimer.current);
        fallbackIdleTimer.current = null;
      }
    };
  }, []);

  return (
    <section className="hse-root" ref={rootRef} aria-label="SOLEVAULT product authentication hero">
      <div className="hse-sticky" ref={stickyRef}>
        <canvas className="hse-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="hse-noise" aria-hidden="true" />
        <div className="hse-light-sweep" aria-hidden="true" />

        <div className={`hse-content${ready ? ' hse-content-ready' : ''}`}>
          <div className="hse-copy" ref={copyRef}>
            <div className={`hse-copy-stage hse-motion-${chapter.motion}`} key={chapter.number}>
              <p className="hse-kicker">{chapter.eyebrow}</p>
              <h1>{chapter.title}</h1>
              <p className="hse-lede">{chapter.body}</p>
              <div className="hse-actions">
                <Link className="hse-button hse-button-primary" to="/shop">
                  {chapter.action} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <div className="hse-scroll-hint" aria-hidden="true">
            <ChevronDown size={16} />
            <span>Scroll to inspect</span>
          </div>
        </div>
      </div>
    </section>
  );
}
