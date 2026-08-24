/**
 * Build-Time Sitemap Generator for SOLEVAULT
 *
 * Generates public/sitemap.xml with canonical URLs, priorities, and change frequencies.
 * Executed during `npm run build` prior to Vite bundle generation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

const BASE_URL = 'https://shoe-resell.vercel.app';
const TODAY = new Date().toISOString().split('T')[0];

// Static core routes with priority and change frequency
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/gallery', priority: '0.85', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/faqs', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms-of-service', priority: '0.5', changefreq: 'monthly' },
  { path: '/refund-policy', priority: '0.5', changefreq: 'monthly' },
  { path: '/shipping-policy', priority: '0.5', changefreq: 'monthly' },
];

// Product catalog IDs/slugs to index
const PRODUCT_SLUGS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
  'nike-air-pegasus-39',
  'adidas-ultraboost-light',
  'puma-rs-x-efekt',
  'new-balance-550-white',
  'asics-gel-kayano-14',
  'reebok-classic-leather',
  'common-projects-achilles',
  'air-jordan-1-mid-chicago',
  'converse-chuck-70-vintage',
  'vans-old-skool-black',
  'salomon-xt-6-black',
  'crocs-classic-clog',
  'nike-air-max-dawn-women'
];

function generateSitemap() {
  console.log('[Sitemap] Generating public/sitemap.xml...');

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const urls = [];

  // 1. Add static routes
  for (const route of STATIC_ROUTES) {
    urls.push(`  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  }

  // 2. Add product routes
  for (const slug of PRODUCT_SLUGS) {
    urls.push(`  <url>
    <loc>${BASE_URL}/product/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, sitemapXml, 'utf8');
  console.log(`[Sitemap] Successfully wrote ${urls.length} URLs to public/sitemap.xml`);
}

generateSitemap();
