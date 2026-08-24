import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

const DEFAULT_TITLE = 'SOLEVAULT | Authentic Sneaker Archive & Marketplace';
const DEFAULT_DESCRIPTION =
  'Curated archive of original footwear at liquidation pricing. 100% authentic deadstock sneakers, running shoes, and street classics verified before dispatch.';
const DEFAULT_IMAGE = '/images/solevault-hero.webp';

function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string | undefined): void {
  if (!content) return;
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function useSEOMeta({
  title,
  description,
  image,
  url,
  type = 'website',
  twitterCard = 'summary_large_image',
}: SEOProps): void {
  useEffect(() => {
    // 1. Update document title
    const finalTitle = title ? (title.includes('SOLEVAULT') ? title : `${title} | SOLEVAULT`) : DEFAULT_TITLE;
    document.title = finalTitle;

    // 2. Standard description
    const finalDesc = description || DEFAULT_DESCRIPTION;
    setMetaTag('name', 'description', finalDesc);

    // 3. Open Graph tags
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shoe-resell.vercel.app';
    const finalUrl = url ? (url.startsWith('http') ? url : `${origin}${url}`) : (typeof window !== 'undefined' ? window.location.href : origin);
    const finalImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : `${origin}${DEFAULT_IMAGE}`;

    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDesc);
    setMetaTag('property', 'og:image', finalImage);
    setMetaTag('property', 'og:url', finalUrl);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'SOLEVAULT');

    // 4. Twitter Card tags
    setMetaTag('name', 'twitter:card', twitterCard);
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDesc);
    setMetaTag('name', 'twitter:image', finalImage);

    return () => {
      // Restore default title on unmount
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, image, url, type, twitterCard]);
}

export default useSEOMeta;
