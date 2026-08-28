import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export default function HomeScrollScenes({ active = true }: { active?: boolean }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !active) return undefined;

    const root = document.querySelector<HTMLElement>('.js-home-motion');
    if (!root) return undefined;

    const responsiveMotion = gsap.matchMedia();
    const context = gsap.context(() => {
      gsap.from('.manifesto h2', {
        y: 72,
        rotateX: 18,
        opacity: 0,
        immediateRender: false,
        transformOrigin: 'left center',
        ease: 'power3.out',
        duration: 1.1,
        scrollTrigger: { trigger: '.manifesto', start: 'top 82%', once: true },
      });

      gsap.from('.manifesto div > p', {
        y: 28,
        opacity: 0,
        immediateRender: false,
        delay: 0.12,
        duration: 0.8,
        scrollTrigger: { trigger: '.manifesto', start: 'top 78%', once: true },
      });

      gsap.fromTo('.manifesto > .section-index',
        { y: 28, opacity: 0.35, rotate: -3 },
        {
          y: -28,
          opacity: 1,
          rotate: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );

      gsap.fromTo('.manifesto h2',
        { letterSpacing: '-0.09em' },
        {
          letterSpacing: '-0.045em',
          ease: 'none',
          scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );

      gsap.utils.toArray<HTMLElement>('.brand-card').forEach((card, index) => {
        gsap.from(card, {
          y: 80,
          rotateY: index % 2 === 0 ? -18 : 18,
          rotateX: 8,
          opacity: 0,
          immediateRender: false,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        });
      });

      const categorySection = root.querySelector<HTMLElement>('.category-section');
      const categoryStrip = root.querySelector<HTMLElement>('.category-strip');
      if (categorySection && categoryStrip) {
        responsiveMotion.add('(min-width: 801px)', () => {
          const distance = () => Math.max(0, categoryStrip.scrollWidth - window.innerWidth + 80);
          gsap.to(categoryStrip, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: categorySection,
              start: 'top 12%',
              end: () => `+=${Math.max(distance() * 0.85, 700)}`,
              scrub: 0.85,
              invalidateOnRefresh: true,
            },
          });
        });
      }

      gsap.utils.toArray<HTMLElement>('.category-card').forEach((card, index) => {
        gsap.fromTo(
          card,
          { rotateY: index % 2 === 0 ? -14 : 14, rotateX: 6, z: -40 },
          {
            rotateY: 0,
            rotateX: 0,
            z: 0,
            ease: 'none',
            scrollTrigger: { trigger: card, start: 'top 90%', end: 'top 40%', scrub: true },
          },
        );
      });

      const dealImage = root.querySelector<HTMLElement>('.deal-image img');
      if (dealImage) {
        gsap.fromTo(
          dealImage,
          { scale: 1.16, y: -48, rotate: -1.4 },
          {
            scale: 1,
            y: 36,
            rotate: 0,
            ease: 'none',
            scrollTrigger: { trigger: '.deal-banner', start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }

      gsap.from('.deal-copy h2', {
        y: 56,
        rotateX: 16,
        opacity: 0,
        immediateRender: false,
        duration: 0.95,
        scrollTrigger: { trigger: '.deal-copy', start: 'top 80%', once: true },
      });

      gsap.fromTo('.deal-copy',
        { y: 34, rotateX: 5 },
        {
          y: -34,
          rotateX: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.deal-banner', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );

      gsap.utils.toArray<HTMLElement>('.trust-item').forEach((item, index) => {
        gsap.from(item, {
          y: 36,
          rotateX: 12,
          opacity: 0,
          immediateRender: false,
          delay: index * 0.06,
          duration: 0.7,
          scrollTrigger: { trigger: '.trust-grid', start: 'top 82%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('.featured-section .product-card').forEach((card, index) => {
        gsap.from(card, {
          y: 64,
          rotateY: index % 2 === 0 ? 10 : -10,
          opacity: 0,
          immediateRender: false,
          duration: 0.75,
          delay: index * 0.08,
          scrollTrigger: { trigger: '.featured-section', start: 'top 78%', once: true },
        });
      });

      gsap.from('.final-cta h2', {
        y: 80,
        scale: 0.92,
        opacity: 0,
        immediateRender: false,
        duration: 1,
        scrollTrigger: { trigger: '.final-cta', start: 'top 78%', once: true },
      });

      gsap.fromTo(
        '.cta-mark',
        { rotate: -28, scale: 0.8, opacity: 0.04 },
        {
          rotate: 8,
          scale: 1.08,
          opacity: 0.12,
          ease: 'none',
          scrollTrigger: { trigger: '.final-cta', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    window.setTimeout(refresh, 280);
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
        responsiveMotion.revert();
      context.revert();
    };
  }, [reduced, active]);

  return null;
}
