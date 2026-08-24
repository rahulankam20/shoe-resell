# Aero Gallery — Antigravity Implementation Handoff

**Objective.** Implement the Aero Gallery visual direction on the existing SoleVault React storefront. This brief is self-contained and is intentionally usable without access to the Figma file.

> **Reference image:** https://solesociety-4i6zgbip.manus.space/manus-storage/figma-aero-gallery-complete_5638a8e7.png

Use the reference image as a visual target only. Rebuild the interface with semantic React markup and CSS; do not use the complete image as a screenshot-based webpage background. The implementation must preserve the current catalog, product, cart, wishlist, authentication, account, administration, Cashfree checkout, and `/api/*` behavior.

## Non-Negotiable Preservation Rules

| Preserve | Do not do |
|---|---|
| Existing routes, data types, API calls, Supabase usage, checkout and security behavior | Replace the storefront with static mock data or a one-page static prototype |
| `HomePage.tsx` fetch from `/api/storefront` | Change the endpoint, response contract, or loading/error states |
| Existing `ProductCard`, image helpers, routes, and cart interactions | Hard-code customer ratings, reviews, or testimonials |
| Current responsive behavior and keyboard navigation | Remove focus states, accessible labels, or reduced-motion support |

## Recommended Change Surface

| File | Responsibility |
|---|---|
| `src/pages/HomePage.tsx` | Replace the visual composition of the home screen while keeping the existing storefront fetch, mapped product data, `Link` routes, loading state, and error state intact. |
| `src/index.css` | Add scoped `aero-*` tokens, layout, responsive behavior, and motion styles. Do not globally break other routes. |
| `src/components/ProductCard.tsx` | Restyle only if it can accept an `aero` variant without affecting existing usage. Otherwise compose an Aero-only card in `HomePage.tsx` using the existing product object. |
| `src/components/ScrollSequence.tsx` | Keep it only if the site still uses the prior hero sequence elsewhere. The Aero home hero should use lightweight CSS transform/opacity effects, not a heavy replacement. |

## Exact Visual System

| Design layer | Specification |
|---|---|
| Background | Warm porcelain: `#F7F6F1`, with subtle mineral/stone texture at very low contrast. |
| Ink | Near-black `#151515`; use cool gray `#6E6E6A` for secondary copy. |
| Accent | Gallery cobalt `#0C45A4`; hover/active blue `#123E8E`; use sparingly for selected size, lines, links, and primary action. |
| Typography | High-contrast editorial serif for hero and product title; clean geometric sans-serif for navigation, controls, metadata, and prices. Use the project’s existing font-loading mechanism or add a compatible licensed web font. |
| Surfaces | White or translucent-white cards, 1 px borders `rgba(20,20,20,.10)`, restrained 10–18 px radii, soft shadow such as `0 18px 45px rgba(28,25,21,.10)`. |
| Photography | Hero: blue-and-white high-top sneaker resting on a pale stone plinth, cobalt circular disc behind it, sunlight and architectural shadows. Product tiles: neutral studio product shots. |

## Desktop Composition

Create the home screen in five semantic sections. Use real product data wherever a product tile, name, size, image, or price appears.

| Section | Layout and content | Real behavior |
|---|---|---|
| Editorial header | Thin logo at left; centered navigation for **Collection**, **Designers**, **Archive**, and **Search**; cart trigger at right. | Reuse existing route links and cart control. Keep header sticky only if the existing site already supports it without conflicts. |
| Hero | Two-column grid. Left: eyebrow **AERO GALLERY**, title **THE ART OF THE EVERYDAY**, short brand statement, outlined **Explore the collection** link. Right: 3D sneaker/plinth visual. Overlay the product-detail card on the far right. | The CTA goes to `/shop`. The product-detail card should link to the first available featured product and use actual name, price, image, size availability, and product route. |
| Curated studies | Left editorial caption, then three product cards in a 3-up grid. | Map `data.featured.slice(0, 3)` or a safe fallback. Each card links to its actual product page and preserves wishlist/cart controls where those exist. |
| Trust/details | Small authentication, condition, box/accessories, and delivery details either within the hero product card or below the cards. | Use only existing product fields or neutral operational labels; do not invent user reviews or ratings. |
| Motion specification band | Full-width quiet footer band labelled **SCROLL BEHAVIOR** with three icon-plus-label items. | Render the visible labels: **Plinth lift · 5%**, **Caption stagger · 60ms**, and **Card elevation · 180ms**. |

## Motion and Interaction Contract

Use CSS transitions and, if already installed, the existing motion library. Animate only `transform` and `opacity`. Every non-essential effect must be disabled under `prefers-reduced-motion: reduce`.

| Trigger | Motion | Duration and easing |
|---|---|---|
| Hero enters viewport | Hero image rises from `translateY(5%)` to `translateY(0)` with opacity fade. | 600–800 ms, `cubic-bezier(0.23, 1, 0.32, 1)` |
| Editorial text | Eyebrow, title, paragraph, then CTA cascade. | 60 ms stagger, same ease-out |
| Product card hover | Lift `translateY(-4px)` and deepen shadow. | 180 ms, ease-out |
| Primary CTA press | Scale to `0.97`. | 140–160 ms, ease-out |
| Sticky product detail panel | Very subtle opacity/translate reveal, no layout animation. | 180 ms, ease-out |

## Responsive Rules

| Breakpoint | Required behavior |
|---|---|
| Desktop, 1024 px and above | Keep the hero at two columns with product detail card in the right column. Use a 3-up product grid. |
| Tablet, 768–1023 px | Stack product detail card below the hero visual; retain two product columns where space permits. |
| Mobile, below 768 px | Collapse navigation into the existing mobile menu pattern; stack title, hero image, and product detail; use a horizontal product scroller or single-column cards; ensure size controls remain tap-safe. |

## Copy-Paste Prompt for Antigravity

```text
Work inside the existing SoleVault React/Vite sneaker-resale repository. Implement an Aero Gallery redesign of the homepage using semantic React and CSS, with the visual reference at:
https://solesociety-4i6zgbip.manus.space/manus-storage/figma-aero-gallery-complete_5638a8e7.png

Important: do not replace or remove existing business logic. Preserve current routes, /api/storefront data fetching, product models, ProductCard behavior, cart, wishlist, auth, account, admin, Cashfree checkout, image helpers, error state, and loading state. Do not make a static mockup and do not add fake customer reviews or ratings.

Target files: src/pages/HomePage.tsx and src/index.css. Reuse existing components and links where possible.

Rebuild the visual design as a light editorial sneaker gallery: warm porcelain background (#F7F6F1), near-black typography (#151515), cobalt accent (#0C45A4), high-contrast serif headings, clean sans-serif controls, pale stone plinth, blue-and-white sneaker visual, restrained white cards, and thin neutral borders.

Home structure:
1. Editorial header: SoleVault logo, Collection / Designers / Archive / Search navigation, cart trigger.
2. Hero: eyebrow “AERO GALLERY”; headline “THE ART OF THE EVERYDAY”; editorial copy; outlined “Explore the collection” CTA linking to /shop; sneaker-on-plinth visual; real data-backed product/size/price panel linking to a featured product.
3. Curated studies: use data.featured.slice(0, 3) for three real product cards with actual image, name, price, size, and routes.
4. Authentication/condition/box-accessories and delivery details only from existing real fields or neutral operations labels.
5. Bottom visible “SCROLL BEHAVIOR” strip with “Plinth lift · 5%”, “Caption stagger · 60ms”, and “Card elevation · 180ms”.

Motion: animate transform and opacity only. Hero plinth lifts 5% during entry; editorial text stagers by 60ms; cards lift 4px on hover over 180ms; CTA press scales to .97 in 160ms. Respect prefers-reduced-motion.

Make the layout responsive: desktop two-column hero plus three cards; tablet stacks the product panel; mobile uses one column/horizontal product scroller and accessible tap targets. Run the existing tests and build before presenting changes. Report exactly which files changed and confirm the preserved business flows.
```

## Antigravity Execution Checklist

1. Open the existing `shoe-resell` repository in Antigravity and paste the prompt above.
2. If Antigravity requests a reference, give it the **Reference image** URL from the top of this document. It can use that public image without Figma access.
3. Instruct it to inspect the existing components before editing and to work only on the visual layer of `HomePage.tsx` and `index.css` unless a small, reusable presentation-only component is necessary.
4. Ask it to preserve the current data-fetching and route wiring, then request a responsive implementation.
5. Require it to run the project’s existing build and test commands. Reject a result that replaces real product/API behavior with mock data.
6. Review desktop and mobile views. Confirm that product links, cart and wishlist triggers, sign-in/account navigation, and checkout entry points still work.

## Acceptance Checklist

- [ ] The page visually matches the Aero Gallery reference without embedding the entire mockup image as the UI.
- [ ] Navigation, hero CTA, product cards, and product detail panel use existing routes and data.
- [ ] No existing commerce, authentication, checkout, security, or API behavior is removed or mocked.
- [ ] The page is responsive and keyboard-accessible.
- [ ] The three motion cues are visibly documented and safely implemented.
- [ ] Existing build and test commands complete successfully.
