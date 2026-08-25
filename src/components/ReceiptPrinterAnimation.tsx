/**
 * ReceiptPrinterAnimation Modal
 *
 * 3D metallic thermal receipt dispenser animation.
 * Features:
 * 1. Exact button styling from the animation package (.print-action-btn and .secondary-action-btn).
 * 2. Pending state with no circular spin — just "(print icon) Printing...".
 * 3. "Tear receipt & export" action with mechanical tear sound, cutter flash, 3D paper tear physics,
 *    an intentional 1.0s pause for visual satisfaction, followed by automatic print/PDF export.
 * 4. Safe try/catch Web Audio synthesizer.
 * 5. Reduced motion support.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Order } from '../types';
import { money } from '../lib/format';

interface Props {
  order: Order;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────
// Web Audio helpers — safe & silent on any autoplay/device block
// ─────────────────────────────────────────────────────────────────
function createAudioContext(): AudioContext | null {
  try {
    const AC =
      (window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    return AC ? new AC() : null;
  } catch {
    return null;
  }
}

function resumeAudioContext(ctx: AudioContext): void {
  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {}
}

function playPrinterSound(ctx: AudioContext, durationMs: number): void {
  try {
    resumeAudioContext(ctx);

    const duration = durationMs / 1000;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(3.5, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.04, now + 0.08);
    gainNode.gain.setValueAtTime(0.04, now + duration - 0.12);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  } catch {}
}

function playTearSound(ctx: AudioContext): void {
  try {
    resumeAudioContext(ctx);

    const now = ctx.currentTime;
    const duration = 0.35;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  } catch {}
}

export default function ReceiptPrinterAnimation({ order, onClose }: Props) {
  const paperRef = useRef<HTMLDivElement>(null);
  const cutterRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isTearing, setIsTearing] = useState(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  // Trigger print rollout sequence
  const startPrint = useCallback(() => {
    clearAllTimeouts();

    const ANIM_MS = 2500;
    const START_DELAY = 180;
    const CUTTER_DELAY = 200;

    setIsPrinting(true);
    setIsPrinted(false);
    setIsTearing(false);

    if (prefersReducedMotion) {
      if (paperRef.current) {
        paperRef.current.className = 'rp-paper rp-printed';
      }
      setIsPrinting(false);
      setIsPrinted(true);
      return;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = createAudioContext();
      }
    } catch {}

    // Reset paper to retracted position
    if (paperRef.current) {
      paperRef.current.className = 'rp-paper rp-retracted';
    }
    if (cutterRef.current) {
      cutterRef.current.classList.remove('rp-cutter-active');
    }

    // ① Paper rollout & audio
    const t1 = window.setTimeout(() => {
      if (paperRef.current) {
        paperRef.current.className = 'rp-paper rp-printing-smooth';
      }
      if (audioCtxRef.current) {
        playPrinterSound(audioCtxRef.current, ANIM_MS);
      }
    }, START_DELAY);

    // ② Paper settles into printed state
    const t2 = window.setTimeout(() => {
      if (paperRef.current) {
        paperRef.current.className = 'rp-paper rp-printed';
      }
    }, START_DELAY + ANIM_MS);

    // ③ Cutter blade flash line
    const t3 = window.setTimeout(() => {
      if (cutterRef.current) {
        cutterRef.current.classList.add('rp-cutter-active');
        window.setTimeout(() => cutterRef.current?.classList.remove('rp-cutter-active'), 400);
      }
      setIsPrinting(false);
      setIsPrinted(true);
    }, START_DELAY + ANIM_MS + CUTTER_DELAY);

    timeoutsRef.current = [t1, t2, t3];
  }, [prefersReducedMotion]);

  // Trigger mechanical tear animation (550ms cut and rip-away) -> wait 0.5s -> close modal
  const triggerTear = () => {
    if (!isPrinted || isPrinting || isTearing) return;

    clearAllTimeouts();
    setIsTearing(true);

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = createAudioContext();
      }
      if (audioCtxRef.current) {
        playTearSound(audioCtxRef.current);
      }
    } catch {}

    // 1. Blade flash
    if (cutterRef.current) {
      cutterRef.current.classList.add('rp-cutter-active');
    }

    // 2. Physical 3D tear-away animation (550ms)
    if (paperRef.current) {
      paperRef.current.className = 'rp-paper rp-tearing';
    }

    // 3. Reset paper to retracted after tear completes (550ms) -> wait 0.5s (500ms) -> close modal
    const t1 = window.setTimeout(() => {
      if (paperRef.current) {
        paperRef.current.className = 'rp-paper rp-retracted';
      }
      if (cutterRef.current) {
        cutterRef.current.classList.remove('rp-cutter-active');
      }
      setIsPrinted(false);

      // Wait 0.5s then close the print modal
      const t2 = window.setTimeout(() => {
        setIsTearing(false);
        onClose();
      }, 500);

      timeoutsRef.current.push(t2);
    }, 550);

    timeoutsRef.current.push(t1);
  };

  useEffect(() => {
    // Mount rollout
    startPrint();

    // Close modal on Escape
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearAllTimeouts();
      window.removeEventListener('keydown', onKeyDown);
      try { audioCtxRef.current?.close(); } catch {}
    };
  }, [startPrint, onClose]);

  const orderDateLabel = (() => {
    try {
      return new Date(order.created_at)
        .toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        .toUpperCase();
    } catch {
      return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    }
  })();

  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + Number(item.sale_price) * Number(item.quantity),
    0,
  );
  const shipping = Number(order.shipping_total) || 0;

  return (
    <div
      className="rp-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Thermal Receipt"
    >
      <div className="rp-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="rp-close-btn"
          aria-label="Close receipt"
        >
          <X size={18} />
        </button>

        {/* 3D Metallic Dispenser Machine */}
        <div className="rp-machine-unit">
          {/* Top gold hood */}
          <div className="rp-hood-top">
            <div className="rp-hood-highlight" />
          </div>

          {/* Dark slit — paper emerges here */}
          <div className="rp-slot-slit" />

          {/* Cutter blade flash effect */}
          <div className="rp-cutter-flash" ref={cutterRef} aria-hidden="true" />

          {/* Bottom hood lip */}
          <div className="rp-hood-bottom">
            <div className="rp-hood-shadow" />
          </div>

          {/* Paper viewport — clips paper above slit, allows shadow below */}
          <div className="rp-paper-viewport" aria-hidden="true">
            <div
              className={`rp-paper ${prefersReducedMotion ? 'rp-printed' : 'rp-retracted'}`}
              ref={paperRef}
            >
              <div className="rp-content" id="rp-printable-receipt">
                {/* Header — SOLEVAULT branding */}
                <div className="rp-receipt-header">
                  <div className="rp-brand-info">
                    <div className="rp-brand-name">SOLEVAULT</div>
                    <div className="rp-payment-title">OFFICIAL RECEIPT</div>
                  </div>
                  <div className="rp-logo-badge" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="5" fill="#ff4d23" />
                      <text
                        x="16"
                        y="21"
                        textAnchor="middle"
                        fill="white"
                        fontWeight="800"
                        fontSize="12"
                        fontFamily="'Courier New', monospace"
                        letterSpacing="0.5"
                      >
                        SV
                      </text>
                    </svg>
                  </div>
                </div>

                {/* Grand total in INR */}
                <div className="rp-amount-section">
                  <div className="rp-amount">{money(order.total)}</div>
                  <div className="rp-meta">{orderDateLabel} · UPI PAID</div>
                </div>

                <div className="rp-divider" />

                {/* Order line items */}
                <div className="rp-items-list">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="rp-item-row">
                      <span className="rp-item-name">
                        {item.quantity > 1 ? `${item.quantity}× ` : ''}
                        {item.brand} {item.product_name}
                        {item.size ? ` / UK ${item.size}` : ''}
                      </span>
                      <span className="rp-item-price">
                        {money(Number(item.sale_price) * Number(item.quantity))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rp-divider" />

                {/* Totals */}
                <div className="rp-totals-section">
                  <div className="rp-total-row">
                    <span>Subtotal</span>
                    <span>{money(itemsSubtotal)}</span>
                  </div>
                  <div className="rp-total-row">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : money(shipping)}</span>
                  </div>
                  <div className="rp-grand-total">
                    <span>TOTAL</span>
                    <span>{money(order.total)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="rp-receipt-footer">
                  <div className="rp-footer-msg">AUTHENTIC PAIR CONFIRMED</div>
                  <div className="rp-barcode-graphic">
                    <div className="rp-barcode-lines" />
                    <div className="rp-barcode-num">
                      {order.order_number || `ORDER-${order.id}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Serrated bottom edge */}
              <div className="rp-serrated-edge" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="rp-actions-bar">
          {/* 1. Print / Print again button with exact zip styling and clean pending state (no spinner) */}
          <button
            type="button"
            className="print-action-btn"
            onClick={startPrint}
            disabled={isPrinting || isTearing}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>{isPrinting ? 'Printing...' : isPrinted ? 'Print again' : 'Print receipt'}</span>
          </button>

          {/* 2. Middle Tear receipt button with exact zip styling */}
          <button
            type="button"
            className="secondary-action-btn"
            onClick={triggerTear}
            disabled={!isPrinted || isPrinting || isTearing}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>{isTearing ? 'Tearing...' : 'Tear receipt'}</span>
          </button>

          {/* 3. Done button */}
          <button
            type="button"
            className="button dark"
            onClick={onClose}
            disabled={isPrinting || isTearing}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
