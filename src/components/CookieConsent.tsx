import { useEffect, useState } from 'react';
import { ShieldCheck, Sliders, X, Check } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY_CONSENT = 'cookie_consent_accepted';
const STORAGE_KEY_PREFS = 'cookie_preferences';

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  preferences: true,
  analytics: false,
  marketing: false,
};

export function getCookiePreferences(): CookiePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw), necessary: true };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY_CONSENT);
    if (!accepted) {
      // Show consent banner after a subtle initial delay
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    } else {
      setPreferences(getCookiePreferences());
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    };
    try {
      localStorage.setItem(STORAGE_KEY_CONSENT, 'true');
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(allAccepted));
    } catch {}
    setPreferences(allAccepted);
    setVisible(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem(STORAGE_KEY_CONSENT, 'true');
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(preferences));
    } catch {}
    setVisible(false);
    setShowModal(false);
  };

  if (!visible && !showModal) return null;

  return (
    <>
      {/* 1. Main Floating Cookie Banner */}
      {visible && !showModal && (
        <aside
          className="cookie-consent-banner"
          role="region"
          aria-label="Cookie & Privacy Consent"
        >
          <div className="cookie-consent-inner">
            <div className="cookie-consent-text">
              <div className="cookie-icon-badge">
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong>COOKIE & DATA TRANSPARENCY</strong>
                <p>
                  SOLEVAULT uses essential session tokens for secure authentication and local storage for your shopping bag. We do not sell your personal data or run invasive third-party tracking.
                </p>
              </div>
            </div>
            <div className="cookie-consent-actions">
              <button
                type="button"
                className="button outline small"
                onClick={() => setShowModal(true)}
              >
                <Sliders size={14} /> Preferences
              </button>
              <button
                type="button"
                className="button primary small"
                onClick={handleAcceptAll}
              >
                <Check size={14} /> Accept all
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Granular Preferences Modal */}
      {showModal && (
        <div
          className="cookie-modal-overlay"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Cookie Preferences"
        >
          <div
            className="cookie-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cookie-modal-head">
              <div>
                <p className="eyebrow accent">PRIVACY CONTROLS</p>
                <h2>COOKIE PREFERENCES</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowModal(false)}
                aria-label="Close preferences"
              >
                <X size={18} />
              </button>
            </div>

            <p className="cookie-modal-sub">
              Customize how SOLEVAULT stores information in your browser. Strictly necessary cookies cannot be disabled as they are required for security, authentication, and order processing.
            </p>

            <div className="cookie-categories-list">
              {/* Category 1: Strictly Necessary */}
              <div className="cookie-cat-row">
                <div className="cookie-cat-info">
                  <div className="cookie-cat-title">
                    <strong>Strictly Necessary</strong>
                    <span className="cookie-badge-locked">Always Active</span>
                  </div>
                  <p>
                    Required for basic site navigation, account sessions, CSRF protection, and cart persistence.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  aria-label="Strictly Necessary Cookies (Always Active)"
                />
              </div>

              {/* Category 2: Functional Preferences */}
              <div className="cookie-cat-row">
                <div className="cookie-cat-info">
                  <div className="cookie-cat-title">
                    <strong>Functional Preferences</strong>
                    <span className="cookie-badge-opt">Optional</span>
                  </div>
                  <p>
                    Preserves your size selections, sorting preference, and UI display options across sessions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.preferences}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, preferences: e.target.checked }))
                  }
                  aria-label="Functional Preferences"
                />
              </div>

              {/* Category 3: Analytics & Performance */}
              <div className="cookie-cat-row">
                <div className="cookie-cat-info">
                  <div className="cookie-cat-title">
                    <strong>Analytics & Performance</strong>
                    <span className="cookie-badge-opt">Optional</span>
                  </div>
                  <p>
                    Helps us understand traffic flow, page load speeds, and resolve edge technical errors anonymously.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                  }
                  aria-label="Analytics and Performance Cookies"
                />
              </div>

              {/* Category 4: Marketing & Communications */}
              <div className="cookie-cat-row">
                <div className="cookie-cat-info">
                  <div className="cookie-cat-title">
                    <strong>Marketing & Drop Alerts</strong>
                    <span className="cookie-badge-opt">Optional</span>
                  </div>
                  <p>
                    Enables personalized grail notifications, restock alerts, and exclusive drop announcements.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                  }
                  aria-label="Marketing and Drop Alert Cookies"
                />
              </div>
            </div>

            <div className="cookie-modal-actions">
              <button
                type="button"
                className="button outline"
                onClick={handleAcceptAll}
              >
                Accept all
              </button>
              <button
                type="button"
                className="button dark"
                onClick={handleSavePreferences}
              >
                Save my preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
