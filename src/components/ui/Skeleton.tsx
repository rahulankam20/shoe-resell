import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'light' | 'dark' | 'accent';
  style?: React.CSSProperties;
}

export function Skeleton({
  className = '',
  width,
  height,
  borderRadius,
  variant = 'light',
  style,
}: SkeletonProps) {
  const variantClass = variant === 'dark' ? 'skeleton-dark' : variant === 'accent' ? 'skeleton-accent' : 'skeleton-light';
  return (
    <div
      className={`skeleton ${variantClass} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * 1:1 match with ProductCard
 */
export function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <div className="product-media skeleton-media">
        <Skeleton width="100%" height="100%" />
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2 }}>
          <Skeleton width="54px" height="22px" variant="accent" />
        </div>
      </div>
      <div className="product-info" style={{ display: 'grid', gap: '0.5rem', paddingTop: '0.85rem' }}>
        <Skeleton width="38%" height="10px" />
        <Skeleton width="82%" height="16px" />
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.3rem' }}>
          <Skeleton width="32%" height="16px" />
          <Skeleton width="22%" height="12px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Responsive Product Grid Skeleton (Shop / Wishlist / Related)
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Full Storefront HomePage Skeleton (Exact 1:1 structure of HomePage)
 */
export function HomePageSkeleton() {
  return (
    <div className="home-skeleton-container page-enter" aria-busy="true" aria-label="Loading storefront">
      {/* 1. Hero Skeleton Scene */}
      <section className="hero-scroll-root" style={{ minHeight: '85vh', background: '#0b0b0b', display: 'flex', alignItems: 'center', padding: 'clamp(4rem, 8vw, 8rem) clamp(2.5rem, 6vw, 7.5rem)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px', zIndex: 2 }}>
          <Skeleton width="160px" height="14px" variant="accent" />
          <Skeleton width="90%" height="clamp(3.5rem, 7vw, 7rem)" variant="dark" />
          <Skeleton width="70%" height="clamp(3.5rem, 7vw, 7rem)" variant="dark" />
          <Skeleton width="60%" height="18px" variant="dark" style={{ marginTop: '0.5rem' }} />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Skeleton width="160px" height="52px" variant="accent" borderRadius="2px" />
            <Skeleton width="140px" height="52px" variant="dark" borderRadius="2px" />
          </div>
        </div>
      </section>

      {/* 2. Marquee Ticker Skeleton */}
      <div style={{ height: '42px', background: '#e4e2de', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
        <Skeleton width="100%" height="14px" />
      </div>

      {/* 3. Manifesto Section Skeleton */}
      <section className="manifesto section-pad" style={{ minHeight: '50vh' }}>
        <div>
          <Skeleton width="180px" height="12px" />
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <Skeleton width="90%" height="clamp(2.8rem, 5vw, 5.5rem)" />
          <Skeleton width="75%" height="clamp(2.8rem, 5vw, 5.5rem)" variant="accent" />
          <Skeleton width="85%" height="16px" style={{ marginTop: '1rem' }} />
          <Skeleton width="70%" height="16px" />
        </div>
      </section>

      {/* 4. Stats Band Skeleton */}
      <section className="stats-band skeleton-stats-band">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <article style={{ display: 'grid', gap: '0.6rem', width: '100%' }}>
              <Skeleton width="55%" height="36px" />
              <Skeleton width="75%" height="12px" />
            </article>
          </div>
        ))}
      </section>

      {/* 5. Brand Grid Skeleton */}
      <section className="brand-section section-pad" style={{ background: '#111' }}>
        <div className="section-head">
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <Skeleton width="140px" height="12px" variant="dark" />
            <Skeleton width="280px" height="42px" variant="dark" />
          </div>
          <Skeleton width="110px" height="24px" variant="dark" />
        </div>
        <div className="brand-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="brand-card" style={{ background: '#161616', position: 'relative' }}>
              <Skeleton width="100%" height="100%" variant="dark" />
              <div className="brand-overlay" style={{ gap: '0.6rem' }}>
                <Skeleton width="24px" height="12px" variant="dark" />
                <Skeleton width="65%" height="32px" variant="dark" />
                <Skeleton width="45%" height="12px" variant="dark" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Category Rail Skeleton */}
      <section className="category-section section-pad">
        <div className="section-head">
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <Skeleton width="130px" height="12px" />
            <Skeleton width="260px" height="40px" />
          </div>
        </div>
        <div className="category-strip">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="category-card" style={{ background: '#e4e2de', position: 'relative' }}>
              <Skeleton width="100%" height="100%" />
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'grid', gap: '0.5rem' }}>
                <Skeleton width="50%" height="12px" variant="dark" />
                <Skeleton width="75%" height="24px" variant="dark" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Deal Banner Skeleton */}
      <section className="deal-banner">
        <div className="deal-image" style={{ background: '#ddd', minHeight: '60vh' }}>
          <Skeleton width="100%" height="100%" />
        </div>
        <div className="deal-copy" style={{ display: 'grid', gap: '1.5rem', padding: 'clamp(3.5rem, 6vw, 7rem) clamp(2.5rem, 5vw, 6rem)' }}>
          <Skeleton width="120px" height="12px" variant="accent" />
          <Skeleton width="85%" height="clamp(2.5rem, 5vw, 4.5rem)" />
          <Skeleton width="70%" height="clamp(2.5rem, 5vw, 4.5rem)" />
          <Skeleton width="90%" height="16px" />
          <Skeleton width="75%" height="16px" />
          <Skeleton width="180px" height="52px" variant="accent" borderRadius="2px" style={{ marginTop: '1rem' }} />
        </div>
      </section>

      {/* 8. Trust Grid Skeleton */}
      <section className="trust-section section-pad">
        <div className="section-head">
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <Skeleton width="150px" height="12px" />
            <Skeleton width="320px" height="38px" />
          </div>
        </div>
        <div className="trust-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="trust-item" style={{ display: 'grid', gap: '0.75rem' }}>
                <Skeleton width="32px" height="32px" borderRadius="4px" variant="accent" />
                <Skeleton width="70%" height="16px" style={{ marginTop: '1rem' }} />
                <Skeleton width="90%" height="12px" />
                <Skeleton width="80%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Featured Products Grid Skeleton */}
      <section className="featured-section section-pad">
        <div className="section-head">
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <Skeleton width="120px" height="12px" />
            <Skeleton width="280px" height="42px" />
          </div>
          <Skeleton width="130px" height="24px" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>
    </div>
  );
}

/**
 * In-page Storefront Content Skeleton (used below manifesto in HomePage while fetching /api/storefront)
 */
export function StorefrontContentSkeleton() {
  return (
    <div className="home-skeleton-container" aria-busy="true" aria-label="Loading storefront content">
      {/* Stats Band Skeleton */}
      <section className="stats-band skeleton-stats-band">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <article style={{ display: 'grid', gap: '0.6rem', width: '100%' }}>
              <Skeleton width="55%" height="36px" />
              <Skeleton width="75%" height="12px" />
            </article>
          </div>
        ))}
      </section>

      {/* Brand Grid Skeleton */}
      <section className="brand-section section-pad" style={{ background: '#111' }}>
        <div className="section-head">
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <Skeleton width="140px" height="12px" variant="dark" />
            <Skeleton width="280px" height="42px" variant="dark" />
          </div>
          <Skeleton width="110px" height="24px" variant="dark" />
        </div>
        <div className="brand-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="brand-card" style={{ background: '#161616', position: 'relative' }}>
              <Skeleton width="100%" height="100%" variant="dark" />
              <div className="brand-overlay" style={{ gap: '0.6rem' }}>
                <Skeleton width="24px" height="12px" variant="dark" />
                <Skeleton width="65%" height="32px" variant="dark" />
                <Skeleton width="45%" height="12px" variant="dark" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Rail Skeleton */}
      <section className="category-section section-pad">
        <div className="section-head">
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <Skeleton width="130px" height="12px" />
            <Skeleton width="260px" height="40px" />
          </div>
        </div>
        <div className="category-strip">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="category-card" style={{ background: '#e4e2de', position: 'relative' }}>
              <Skeleton width="100%" height="100%" />
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'grid', gap: '0.5rem' }}>
                <Skeleton width="50%" height="12px" variant="dark" />
                <Skeleton width="75%" height="24px" variant="dark" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deal Banner Skeleton */}
      <section className="deal-banner">
        <div className="deal-image" style={{ background: '#ddd', minHeight: '60vh' }}>
          <Skeleton width="100%" height="100%" />
        </div>
        <div className="deal-copy" style={{ display: 'grid', gap: '1.5rem', padding: 'clamp(3.5rem, 6vw, 7rem) clamp(2.5rem, 5vw, 6rem)' }}>
          <Skeleton width="120px" height="12px" variant="accent" />
          <Skeleton width="85%" height="clamp(2.5rem, 5vw, 4.5rem)" />
          <Skeleton width="70%" height="clamp(2.5rem, 5vw, 4.5rem)" />
          <Skeleton width="90%" height="16px" />
          <Skeleton width="75%" height="16px" />
          <Skeleton width="180px" height="52px" variant="accent" borderRadius="2px" style={{ marginTop: '1rem' }} />
        </div>
      </section>

      {/* Trust Grid Skeleton */}
      <section className="trust-section section-pad">
        <div className="section-head">
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <Skeleton width="150px" height="12px" />
            <Skeleton width="320px" height="38px" />
          </div>
        </div>
        <div className="trust-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="trust-item" style={{ display: 'grid', gap: '0.75rem' }}>
                <Skeleton width="32px" height="32px" borderRadius="4px" variant="accent" />
                <Skeleton width="70%" height="16px" style={{ marginTop: '1rem' }} />
                <Skeleton width="90%" height="12px" />
                <Skeleton width="80%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Grid Skeleton */}
      <section className="featured-section section-pad">
        <div className="section-head">
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <Skeleton width="120px" height="12px" />
            <Skeleton width="280px" height="42px" />
          </div>
          <Skeleton width="130px" height="24px" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>
    </div>
  );
}

/**
 * Full Shop Page Skeleton (Hero + Filter Sidebar + 8 Product Grid)
 */
export function ShopPageSkeleton() {
  return (
    <div className="shop-page page-shell page-enter" aria-busy="true" aria-label="Loading catalog">
      <header className="shop-hero" style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
        <Skeleton width="140px" height="14px" variant="accent" />
        <Skeleton width="340px" height="clamp(2.5rem, 5vw, 4.5rem)" />
        <Skeleton width="280px" height="16px" />
      </header>

      {/* Catalog Toolbar Skeleton */}
      <div className="catalog-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
        <Skeleton width="110px" height="38px" borderRadius="4px" />
        <Skeleton width="120px" height="16px" />
        <Skeleton width="140px" height="38px" borderRadius="4px" />
      </div>

      <div className="catalog-layout">
        {/* Left Filter Sidebar Skeleton */}
        <aside className="filters" style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="filter-group">
            <Skeleton width="60px" height="12px" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="100%" height="42px" borderRadius="4px" />
          </div>
          <div className="filter-group">
            <Skeleton width="50px" height="12px" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="100%" height="42px" borderRadius="4px" />
          </div>
          <div className="filter-group">
            <Skeleton width="70px" height="12px" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="100%" height="42px" borderRadius="4px" />
          </div>
          <div className="filter-group">
            <Skeleton width="60px" height="12px" style={{ marginBottom: '0.5rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {[4, 5, 6, 7, 8, 9, 10, 11].map((s) => (
                <Skeleton key={s} height="36px" borderRadius="3px" />
              ))}
            </div>
          </div>
          <div className="filter-group">
            <Skeleton width="45px" height="12px" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="100%" height="42px" borderRadius="4px" />
          </div>
          <Skeleton width="100%" height="46px" borderRadius="4px" variant="dark" />
        </aside>

        {/* Right Product Grid Skeleton */}
        <section className="catalog-results">
          <ProductGridSkeleton count={8} />
        </section>
      </div>
    </div>
  );
}

/**
 * Product Detail Page (PDP) Skeleton (Gallery thumbnails + Large canvas + Buy panel + Related)
 */
export function ProductPageSkeleton() {
  return (
    <div className="product-page page-shell page-enter" aria-busy="true" aria-label="Loading product details">
      <div style={{ marginBottom: '1.75rem' }}>
        <Skeleton width="140px" height="16px" />
      </div>

      <div className="product-detail-grid">
        {/* Left Column: Gallery */}
        <div className="product-gallery">
          <div className="product-gallery-layout" style={{ display: 'flex', gap: '1rem' }}>
            {/* Thumbnail Strip */}
            <div className="gallery-thumbs" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '74px' }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width="74px" height="74px" borderRadius="4px" />
              ))}
            </div>
            {/* Main Stage */}
            <div className="product-zoom-stage" style={{ flex: 1, minHeight: '480px', background: '#e4e2de' }}>
              <Skeleton width="100%" height="100%" borderRadius="8px" />
            </div>
          </div>
        </div>

        {/* Right Column: Buy Panel */}
        <div className="product-buy-panel" style={{ display: 'grid', gap: '1.25rem' }}>
          <div>
            <Skeleton width="90px" height="12px" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="85%" height="38px" style={{ marginBottom: '0.75rem' }} />
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <Skeleton width="110px" height="28px" />
              <Skeleton width="80px" height="20px" />
              <Skeleton width="64px" height="22px" variant="accent" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '1.25rem 0', display: 'grid', gap: '0.8rem' }}>
            <Skeleton width="100%" height="14px" />
            <Skeleton width="92%" height="14px" />
            <Skeleton width="78%" height="14px" />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <Skeleton width="100px" height="14px" />
              <Skeleton width="70px" height="14px" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {[6, 7, 8, 9, 10].map((s) => (
                <Skeleton key={s} height="46px" borderRadius="4px" />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Skeleton width="100%" height="52px" borderRadius="4px" variant="accent" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Skeleton height="48px" borderRadius="4px" />
              <Skeleton height="48px" borderRadius="4px" />
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <section style={{ marginTop: '5rem', borderTop: '1px solid var(--line)', paddingTop: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Skeleton width="140px" height="12px" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="280px" height="32px" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>
    </div>
  );
}

/**
 * Aero Gallery Exhibition Page Skeleton (Cinematic Hero + Filters Bar + 3D Grid)
 */
export function AeroGallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="aero-gallery-page page-enter" aria-busy="true" aria-label="Loading exhibition gallery">
      {/* 1. Cinematic Hero Skeleton */}
      <section className="aero-hero">
        <div className="aero-hero-inner" style={{ display: 'grid', gap: '1rem' }}>
          <Skeleton width="220px" height="24px" borderRadius="20px" variant="accent" />
          <Skeleton width="340px" height="clamp(3rem, 6vw, 5.5rem)" variant="dark" />
          <Skeleton width="550px" height="18px" variant="dark" />

          {/* Telemetry Stats Bar */}
          <div className="aero-stats-ticker" style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '8px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'grid', gap: '0.35rem' }}>
                <Skeleton width="60px" height="28px" variant="dark" />
                <Skeleton width="110px" height="10px" variant="dark" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Filter Nav Bar Skeleton */}
      <nav className="aero-nav-bar">
        <div className="aero-nav-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="aero-filter-chips" style={{ display: 'flex', gap: '0.6rem' }}>
            {['All', 'Grail Vault', 'Collab & Tech', 'Performance Icons', 'Street Classics'].map((t) => (
              <Skeleton key={t} width="110px" height="36px" borderRadius="20px" />
            ))}
          </div>
          <Skeleton width="90px" height="28px" borderRadius="14px" />
        </div>
      </nav>

      {/* 3. 3D Masonry Grid Skeleton */}
      <section className="aero-gallery-container page-shell">
        <div className="aero-grid">
          {Array.from({ length: count }).map((_, idx) => (
            <article key={idx} className="aero-card skeleton-card">
              <div className="aero-card-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton width="75px" height="18px" />
                <Skeleton width="90px" height="18px" />
              </div>

              <div className="aero-card-media" style={{ background: '#e4e2de', minHeight: '260px' }}>
                <Skeleton width="100%" height="100%" />
              </div>

              <div className="aero-card-info" style={{ display: 'grid', gap: '0.6rem', marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton width="35%" height="12px" />
                  <Skeleton width="20%" height="12px" />
                </div>
                <Skeleton width="85%" height="20px" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.4rem' }}>
                  <Skeleton width="30%" height="18px" />
                  <Skeleton width="35%" height="14px" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Wishlist Page Skeleton (Header + 4 Product Grid)
 */
export function WishlistPageSkeleton() {
  return (
    <div className="page-shell wishlist-page page-enter" aria-busy="true" aria-label="Loading wishlist">
      <header className="page-title" style={{ display: 'grid', gap: '0.5rem', marginBottom: '2.5rem' }}>
        <Skeleton width="120px" height="12px" variant="accent" />
        <Skeleton width="280px" height="clamp(2.5rem, 5vw, 4rem)" />
        <Skeleton width="200px" height="16px" />
      </header>
      <ProductGridSkeleton count={4} />
    </div>
  );
}

/**
 * Account Member Vault Page Skeleton (Header + Tabs Nav + Content Panels)
 */
export function AccountPageSkeleton() {
  return (
    <div className="account-page page-shell page-enter" aria-busy="true" aria-label="Loading account">
      <header className="account-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <Skeleton width="120px" height="12px" variant="accent" />
          <Skeleton width="300px" height="36px" />
          <Skeleton width="180px" height="14px" />
        </div>
        <Skeleton width="160px" height="42px" borderRadius="4px" />
      </header>

      <div className="account-layout">
        {/* Navigation Sidebar Skeleton */}
        <nav className="account-nav" style={{ display: 'grid', gap: '0.5rem' }}>
          {['Profile', 'Orders', 'Addresses', 'Wishlist', 'Log out'].map((item) => (
            <Skeleton key={item} width="100%" height="48px" borderRadius="4px" />
          ))}
        </nav>

        {/* Content Section Skeleton */}
        <section className="account-content">
          <div className="account-panel" style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <Skeleton width="120px" height="12px" style={{ marginBottom: '0.4rem' }} />
              <Skeleton width="220px" height="28px" />
            </div>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ border: '1px solid var(--line)', padding: '1.25rem', display: 'grid', gap: '0.75rem', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Skeleton width="30%" height="18px" />
                    <Skeleton width="20%" height="18px" />
                  </div>
                  <Skeleton width="55%" height="14px" />
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                    <Skeleton width="48px" height="48px" borderRadius="4px" />
                    <div style={{ flex: 1, display: 'grid', gap: '0.35rem' }}>
                      <Skeleton width="60%" height="14px" />
                      <Skeleton width="30%" height="11px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Admin Console Skeleton (Header + Tabs + Table)
 */
export function AdminPageSkeleton() {
  return (
    <div className="admin-page page-shell page-enter" aria-busy="true" aria-label="Loading admin console">
      <header className="admin-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <Skeleton width="160px" height="12px" variant="accent" />
          <Skeleton width="260px" height="36px" />
        </div>
        <Skeleton width="120px" height="42px" borderRadius="4px" />
      </header>

      {/* Tabs */}
      <nav className="admin-tabs" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        {['Products', 'Orders', 'Payments', 'Brands & categories', 'Users'].map((t) => (
          <Skeleton key={t} width="130px" height="44px" borderRadius="4px" />
        ))}
      </nav>

      <section className="admin-panel" style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            <Skeleton width="180px" height="28px" />
            <Skeleton width="120px" height="12px" />
          </div>
          <Skeleton width="130px" height="38px" borderRadius="4px" />
        </div>
        <div className="admin-table-wrap">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <th key={i} style={{ padding: '0.8rem' }}>
                    <Skeleton width="70%" height="14px" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <tr key={row}>
                  {[1, 2, 3, 4, 5, 6].map((col) => (
                    <td key={col} style={{ padding: '1rem 0.8rem' }}>
                      <Skeleton width={col === 1 ? '90%' : col === 6 ? '50px' : '75%'} height="16px" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/**
 * Order Confirmation Page Skeleton (Receipt Card + Timeline + Details)
 */
export function OrderConfirmationSkeleton() {
  return (
    <div className="confirmation-page page-shell page-enter" aria-busy="true" style={{ display: 'grid', placeItems: 'center', minHeight: '65vh' }}>
      <div className="confirmation-card" style={{ width: '100%', maxWidth: '640px', padding: '2.5rem', background: '#fff', border: '1px solid var(--line)', display: 'grid', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton width="64px" height="64px" borderRadius="50%" variant="accent" />
        </div>
        <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'center' }}>
          <Skeleton width="160px" height="14px" />
          <Skeleton width="320px" height="36px" />
          <Skeleton width="220px" height="16px" />
        </div>
        <div style={{ display: 'grid', gap: '0.8rem', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '1.5rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="35%" height="16px" />
            <Skeleton width="25%" height="16px" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width="40%" height="16px" />
            <Skeleton width="20%" height="16px" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Skeleton width="140px" height="46px" borderRadius="4px" />
          <Skeleton width="140px" height="46px" borderRadius="4px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Auth Login / Signup Page Skeleton (1.1fr visual + 0.9fr form wrapper)
 */
export function AuthPageSkeleton() {
  return (
    <div className="auth-page page-enter" aria-busy="true" aria-label="Loading authentication">
      {/* Left Visual Hero */}
      <div className="auth-visual" style={{ position: 'relative', background: '#111', minHeight: '720px', overflow: 'hidden' }}>
        <Skeleton width="100%" height="100%" variant="dark" />
        <div style={{ position: 'absolute', left: '8%', bottom: '9%', display: 'grid', gap: '0.8rem', zIndex: 2 }}>
          <Skeleton width="140px" height="12px" variant="accent" />
          <Skeleton width="340px" height="clamp(2.5rem, 5vw, 5rem)" variant="dark" />
          <Skeleton width="280px" height="clamp(2.5rem, 5vw, 5rem)" variant="dark" />
          <Skeleton width="380px" height="16px" variant="dark" style={{ marginTop: '0.5rem' }} />
        </div>
      </div>

      {/* Right Form Panel */}
      <section className="auth-form-wrap">
        <div className="auth-form" style={{ display: 'grid', gap: '1.25rem' }}>
          <Skeleton width="160px" height="12px" variant="accent" />
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <Skeleton width="260px" height="42px" />
            <Skeleton width="200px" height="14px" />
          </div>

          <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1rem' }}>
            {/* Input 1 */}
            <div>
              <Skeleton width="90px" height="12px" style={{ marginBottom: '0.45rem' }} />
              <Skeleton width="100%" height="46px" borderRadius="2px" />
            </div>

            {/* Input 2 */}
            <div>
              <Skeleton width="80px" height="12px" style={{ marginBottom: '0.45rem' }} />
              <Skeleton width="100%" height="46px" borderRadius="2px" />
            </div>

            {/* Submit Button */}
            <Skeleton width="100%" height="50px" borderRadius="2px" variant="dark" style={{ marginTop: '0.5rem' }} />

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              <Skeleton width="24px" height="12px" />
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
            </div>

            {/* Google Button */}
            <Skeleton width="100%" height="48px" borderRadius="2px" />

            {/* Switch link */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
              <Skeleton width="180px" height="14px" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Cart / Shopping Bag Page Skeleton (Header + 2-Column Items List & Order Summary)
 */
export function CartPageSkeleton() {
  return (
    <div className="cart-page page-shell page-enter" aria-busy="true" aria-label="Loading shopping cart">
      {/* Header */}
      <header className="page-title" style={{ display: 'grid', gap: '0.5rem', marginBottom: '2.5rem' }}>
        <Skeleton width="130px" height="12px" variant="accent" />
        <Skeleton width="280px" height="clamp(2.5rem, 5vw, 4.5rem)" />
        <Skeleton width="160px" height="14px" />
      </header>

      {/* 2-Column Cart Layout */}
      <div className="cart-layout">
        {/* Left Column: Cart Items List */}
        <section className="cart-items" style={{ display: 'grid', gap: '1.25rem' }}>
          {[1, 2].map((i) => (
            <article key={i} className="cart-item" style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '1.5rem', padding: '1.5rem', border: '1px solid var(--line)', background: '#fff' }}>
              <div style={{ width: '120px', height: '120px', background: '#e4e2de' }}>
                <Skeleton width="100%" height="100%" />
              </div>
              <div className="cart-item-copy" style={{ display: 'grid', gap: '0.6rem' }}>
                <Skeleton width="90px" height="10px" />
                <Skeleton width="75%" height="24px" />
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <Skeleton width="80px" height="34px" borderRadius="3px" />
                  <Skeleton width="90px" height="34px" borderRadius="3px" />
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginTop: '0.3rem' }}>
                  <Skeleton width="80px" height="20px" />
                  <Skeleton width="60px" height="14px" />
                </div>
              </div>
              <div>
                <Skeleton width="28px" height="28px" borderRadius="4px" />
              </div>
            </article>
          ))}
        </section>

        {/* Right Column: Order Summary Box */}
        <aside className="order-summary" style={{ display: 'grid', gap: '1rem', padding: '2rem', border: '1px solid var(--line)', background: '#fff' }}>
          <Skeleton width="110px" height="10px" />
          <Skeleton width="160px" height="36px" />
          <div style={{ display: 'grid', gap: '0.75rem', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '1.25rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="35%" height="14px" />
              <Skeleton width="25%" height="14px" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="40%" height="14px" variant="accent" />
              <Skeleton width="25%" height="14px" variant="accent" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="30%" height="14px" />
              <Skeleton width="20%" height="14px" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="30%" height="20px" />
            <Skeleton width="35%" height="24px" />
          </div>
          <Skeleton width="100%" height="34px" borderRadius="2px" />
          <Skeleton width="100%" height="50px" borderRadius="2px" variant="accent" style={{ marginTop: '0.5rem' }} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.4rem' }}>
            <Skeleton width="200px" height="12px" />
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Checkout Page Skeleton (Form fields + Order Summary)
 */
export function CheckoutPageSkeleton() {
  return (
    <div className="checkout-page page-shell page-enter" aria-busy="true" aria-label="Loading checkout">
      <div style={{ marginBottom: '1.5rem' }}>
        <Skeleton width="120px" height="16px" />
      </div>

      <div className="checkout-grid">
        {/* Left Column: Form */}
        <div className="checkout-form" style={{ display: 'grid', gap: '2rem' }}>
          <div>
            <Skeleton width="140px" height="12px" variant="accent" />
            <Skeleton width="360px" height="clamp(2.5rem, 5vw, 4.5rem)" style={{ margin: '0.75rem 0' }} />
          </div>

          <div style={{ border: '1px solid var(--line)', padding: '1.5rem', background: '#fff', display: 'grid', gap: '1.25rem' }}>
            <Skeleton width="160px" height="18px" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Skeleton height="46px" borderRadius="2px" />
              <Skeleton height="46px" borderRadius="2px" />
            </div>
            <Skeleton height="46px" borderRadius="2px" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <Skeleton height="46px" borderRadius="2px" />
              <Skeleton height="46px" borderRadius="2px" />
              <Skeleton height="46px" borderRadius="2px" />
            </div>
          </div>
        </div>

        {/* Right Column: Review & Total */}
        <div className="checkout-summary-wrap">
          <aside className="order-summary" style={{ display: 'grid', gap: '1rem', padding: '2rem', border: '1px solid var(--line)', background: '#fff' }}>
            <Skeleton width="130px" height="12px" />
            <Skeleton width="160px" height="36px" />
            <div style={{ display: 'grid', gap: '0.75rem', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '1.25rem 0' }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <Skeleton width="48px" height="48px" borderRadius="3px" />
                  <div style={{ flex: 1, display: 'grid', gap: '0.3rem' }}>
                    <Skeleton width="75%" height="13px" />
                    <Skeleton width="40%" height="10px" />
                  </div>
                  <Skeleton width="50px" height="14px" />
                </div>
              ))}
            </div>
            <Skeleton width="100%" height="52px" borderRadius="2px" variant="accent" style={{ marginTop: '0.5rem' }} />
          </aside>
        </div>
      </div>
    </div>
  );
}
