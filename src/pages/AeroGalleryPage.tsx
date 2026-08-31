import { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Eye, X, ArrowUpRight, Filter, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSEOMeta } from '../hooks/useSEOMeta';
import { money } from '../lib/format';
import { getProductImage } from '../lib/images';
import { AeroGallerySkeleton } from '../components/ui/Skeleton';
import type { Product } from '../types';

interface GalleryShoe {
  product: Product;
  tier: 'grail' | 'collab' | 'performance' | 'classic';
  tierLabel: string;
  year: string;
  sku: string;
  colorway: string;
  rarityScore: number;
  highlightNote: string;
}

const TIER_MAPPINGS: Record<string, { tier: 'grail' | 'collab' | 'performance' | 'classic'; tierLabel: string; year: string; sku: string; colorway: string; rarityScore: number; highlightNote: string }> = {
  '1': { tier: 'performance', tierLabel: 'Performance Icon', year: '2022', sku: 'NK-PEG39-01', colorway: 'Pure Platinum / Laser Blue', rarityScore: 88, highlightNote: 'Engineered dual Zoom Air units with Flywire lock down.' },
  '2': { tier: 'performance', tierLabel: 'Performance Icon', year: '2023', sku: 'AD-UB-LT23', colorway: 'Core Black / Cloud White', rarityScore: 91, highlightNote: 'Light BOOST midsole foam with LEP linear energy push system.' },
  '3': { tier: 'classic', tierLabel: 'Street Classic', year: '2022', sku: 'PM-RSX-EFK', colorway: 'Warm White / High-Risk Red', rarityScore: 84, highlightNote: 'Retro-futuristic silhouette with sculpted angular heel cage.' },
  '4': { tier: 'grail', tierLabel: 'Grail Archive', year: '1989 / 2021', sku: 'NB-550-WGR', colorway: 'Sea Salt / Pine Green', rarityScore: 96, highlightNote: 'Pro-basketball heritage design with premium perforated leather.' },
  '5': { tier: 'performance', tierLabel: 'Performance Icon', year: '2008 / 2022', sku: 'AS-GEL-K14', colorway: 'Metallic Silver / Black', rarityScore: 94, highlightNote: 'Late 2000s runner aesthetic with full-length GEL cushioning.' },
  '6': { tier: 'classic', tierLabel: 'Street Classic', year: '1983 / 2023', sku: 'RBK-CL-001', colorway: 'Chalk / Glen Green', rarityScore: 82, highlightNote: 'Garment leather upper with lightweight die-cut EVA midsole.' },
  '7': { tier: 'grail', tierLabel: 'Grail Archive', year: '2016', sku: 'CP-ACH-WHT', colorway: 'Optic White / Gold Foil', rarityScore: 98, highlightNote: 'Italian nappa leather low-top with stamped serial numbering.' },
  '8': { tier: 'grail', tierLabel: 'Grail Archive', year: '1985 / 2020', sku: 'AJ1-MID-CHI', colorway: 'Varsity Red / White / Black', rarityScore: 97, highlightNote: 'Iconic Chicago color blocking in mid-cut silhouette.' },
  '9': { tier: 'collab', tierLabel: 'Collab Special', year: '1970 / 2022', sku: 'CONV-CH70-V', colorway: 'Parchment / Egret', rarityScore: 89, highlightNote: 'Heavyweight 12oz canvas with varnished egret foxing.' },
  '10': { tier: 'classic', tierLabel: 'Street Classic', year: '1977 / 2023', sku: 'VN-OS-BLK', colorway: 'Black / True White', rarityScore: 85, highlightNote: 'The original skate sidestripe model with vulcanized waffle sole.' },
  '11': { tier: 'collab', tierLabel: 'Collab Special', year: '2013 / 2023', sku: 'SAL-XT6-ADV', colorway: 'Triple Black / Ghost Gray', rarityScore: 95, highlightNote: 'Trail racing legend with Quicklace system and ACS chassis.' },
  '12': { tier: 'classic', tierLabel: 'Street Classic', year: '2002 / 2023', sku: 'CRC-CLG-BLK', colorway: 'Matte Black', rarityScore: 80, highlightNote: 'Croslite lightweight molded comfort with ventilation ports.' },
  '13': { tier: 'classic', tierLabel: 'Street Classic', year: '2022', sku: 'NK-AM-DAWN', colorway: 'Summit White / Malachite', rarityScore: 86, highlightNote: 'Vintage track aesthetics with low-profile Air-Sole cushion.' },
};

const FILTER_TIERS = [
  { id: 'all', label: 'All Silhouettes' },
  { id: 'grail', label: 'Grail Vault' },
  { id: 'collab', label: 'Collab & Tech' },
  { id: 'performance', label: 'Performance Icons' },
  { id: 'classic', label: 'Street Classics' },
];

export default function AeroGalleryPage() {
  useSEOMeta({
    title: 'Aero Gallery | Archival Sneaker Exhibition | SOLEVAULT',
    description: 'Immerse yourself in the SOLEVAULT Aero Gallery. An architectural digital exhibition showcasing rare grails, collabs, and performance icons.',
    url: '/gallery',
  });

  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTier, setActiveTier] = useState<string>('all');
  const [spotlightShoe, setSpotlightShoe] = useState<GalleryShoe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/storefront')
      .then((res) => res.json())
      .then((data) => {
        const list: Product[] = data.featured || data.deals || [];
        setProducts(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const galleryItems: GalleryShoe[] = useMemo(() => {
    return products.map((p) => {
      const meta = TIER_MAPPINGS[String(p.id)] || {
        tier: 'classic',
        tierLabel: 'Curated Icon',
        year: '2023',
        sku: `SV-${p.id.toString().padStart(3, '0')}`,
        colorway: 'Original Factory Colorway',
        rarityScore: 85,
        highlightNote: 'Deadstock original condition from verified liquidation sources.',
      };
      return {
        product: p,
        ...meta,
      };
    });
  }, [products]);

  const filteredItems = useMemo(() => {
    if (activeTier === 'all') return galleryItems;
    return galleryItems.filter((item) => item.tier === activeTier);
  }, [galleryItems, activeTier]);

  return (
    <div className="aero-gallery-page">
      {/* 1. Cinematic Hero Section */}
      <section className="aero-hero">
        <div className="aero-hero-inner">
          <div className="aero-eyebrow-chip">
            <Sparkles size={14} />
            <span>ARCHIVAL EXHIBITION · VOL. 01</span>
          </div>
          <h1 className="aero-title">
            THE AERO<br />
            <span>GALLERY.</span>
          </h1>
          <p className="aero-description">
            A high-definition visual exploration of sneaker design milestones, rare deadstock silhouettes, and liquidation grails. Every pair verified authentic.
          </p>

          {/* Telemetry Stats Bar */}
          <div className="aero-stats-ticker">
            <div className="aero-stat-item">
              <span className="aero-stat-num">{galleryItems.length}</span>
              <span className="aero-stat-label">CURATED SILHOUETTES</span>
            </div>
            <div className="aero-stat-divider" />
            <div className="aero-stat-item">
              <span className="aero-stat-num">100%</span>
              <span className="aero-stat-label">AUTHENTIC DEADSTOCK</span>
            </div>
            <div className="aero-stat-divider" />
            <div className="aero-stat-item">
              <span className="aero-stat-num">50–75%</span>
              <span className="aero-stat-label">OFF RETAIL MRP</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Filter Navigation Toolbar */}
      <nav className="aero-nav-bar" aria-label="Gallery category filters">
        <div className="aero-nav-inner">
          <div className="aero-filter-chips">
            {FILTER_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                className={`aero-chip ${activeTier === tier.id ? 'active' : ''}`}
                onClick={() => setActiveTier(tier.id)}
              >
                {tier.label}
              </button>
            ))}
          </div>
          <span className="aero-counter-pill">
            <Layers size={13} /> {filteredItems.length} Exhibits
          </span>
        </div>
      </nav>

      {/* 3. Exhibition Masonry / 3D Perspective Grid */}
      <section className="aero-gallery-container page-shell">
        {loading ? (
          <AeroGallerySkeleton count={6} />
        ) : (
          <div className="aero-grid">
            {filteredItems.map((item, idx) => (
            <article
              key={item.product.id}
              className="aero-card"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Card Top Telemetry */}
              <div className="aero-card-head">
                <span className="aero-sku-badge">{item.sku}</span>
                <span className="aero-tier-badge">{item.tierLabel}</span>
              </div>

              {/* Shoe Image Media Canvas with 3D Depth Elevation */}
              <div
                className="aero-card-media"
                onClick={() => setSpotlightShoe(item)}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${item.product.brand} ${item.product.name}`}
              >
                <div className="aero-glow-halo" aria-hidden="true" />
                <img
                  src={getProductImage(item.product, 0)}
                  alt={`${item.product.brand} ${item.product.name}`}
                  className="aero-shoe-img"
                  loading="lazy"
                />
                <button
                  type="button"
                  className="aero-inspect-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpotlightShoe(item);
                  }}
                  aria-label="Inspect silhouette"
                >
                  <Eye size={14} /> Quick Inspect
                </button>
              </div>

              {/* Card Specs Matrix */}
              <div className="aero-card-body">
                <div className="aero-card-titles">
                  <span className="aero-brand-tag">{item.product.brand}</span>
                  <h3 className="aero-product-title">{item.product.name}</h3>
                </div>

                <p className="aero-colorway-note">{item.colorway}</p>

                <div className="aero-pricing-row">
                  <div className="aero-price-stack">
                    <span className="aero-sale-price">{money(item.product.sale_price)}</span>
                    <span className="aero-mrp-price">{money(item.product.mrp)}</span>
                  </div>
                  <span className="aero-discount-tag">
                    {item.product.discount}% OFF
                  </span>
                </div>

                {/* Direct Action Link */}
                <div className="aero-card-actions">
                  <button
                    type="button"
                    className="button dark small full"
                    onClick={() => navigate(`/product/${item.product.id}`)}
                  >
                    Acquire Pair <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </section>

      {/* 4. Focal Spotlight Inspection Modal */}
      {spotlightShoe && (
        <div
          className="aero-modal-overlay"
          onClick={() => setSpotlightShoe(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Silhouette Inspection"
        >
          <div
            className="aero-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="aero-modal-close"
              onClick={() => setSpotlightShoe(null)}
              aria-label="Close inspection"
            >
              <X size={18} />
            </button>

            <div className="aero-modal-grid">
              {/* Left Viewport: High Res Floating Shoe */}
              <div className="aero-modal-visual">
                <div className="aero-modal-halo" />
                <img
                  src={getProductImage(spotlightShoe.product, 0)}
                  alt={spotlightShoe.product.name}
                  className="aero-modal-shoe"
                />
                <div className="aero-auth-stamp">
                  <ShieldCheck size={16} /> 100% VERIFIED AUTHENTIC
                </div>
              </div>

              {/* Right Viewport: Deep Telemetry Breakdown */}
              <div className="aero-modal-details">
                <p className="eyebrow accent">{spotlightShoe.tierLabel.toUpperCase()}</p>
                <h2>{spotlightShoe.product.brand} {spotlightShoe.product.name}</h2>

                <div className="aero-spec-table">
                  <div className="aero-spec-row">
                    <span>SKU Code</span>
                    <strong>{spotlightShoe.sku}</strong>
                  </div>
                  <div className="aero-spec-row">
                    <span>Archival Release</span>
                    <strong>{spotlightShoe.year}</strong>
                  </div>
                  <div className="aero-spec-row">
                    <span>Factory Colorway</span>
                    <strong>{spotlightShoe.colorway}</strong>
                  </div>
                  <div className="aero-spec-row">
                    <span>Rarity Index</span>
                    <strong>{spotlightShoe.rarityScore} / 100</strong>
                  </div>
                  <div className="aero-spec-row">
                    <span>Condition</span>
                    <strong>Brand New · Deadstock</strong>
                  </div>
                </div>

                <p className="aero-modal-note">
                  {spotlightShoe.highlightNote}
                </p>

                <div className="aero-modal-pricing">
                  <div>
                    <span className="aero-modal-sale">{money(spotlightShoe.product.sale_price)}</span>
                    <span className="aero-modal-mrp">{money(spotlightShoe.product.mrp)}</span>
                  </div>
                  <span className="aero-modal-discount">{spotlightShoe.product.discount}% OFF</span>
                </div>

                <div className="aero-modal-actions">
                  <button
                    type="button"
                    className="button primary full"
                    onClick={() => {
                      setSpotlightShoe(null);
                      navigate(`/product/${spotlightShoe.product.id}`);
                    }}
                  >
                    View Available Sizes & Buy <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
