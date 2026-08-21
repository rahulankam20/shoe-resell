---
name: ui-ux-max
description: "Comprehensive product design and user experience architecture framework. Focuses on information architecture, frictionless e-commerce checkout & search discovery, robust scroll containment, keyboard accessibility, state handling, and touch ergonomic optimization across all viewports."
---

# UI/UX Max: Interaction & Product Architecture

## E-Commerce & Product Discovery Rules
1. **Search Experience**:
   - Header-anchored search dropdown must be fast, instant, and frictionless.
   - Live debounced preview (150ms-200ms) with clean categorization.
   - **Scroll Containment**: Search result container MUST independently scroll (`overflow-y: auto; overscroll-behavior: contain; max-height: min(68vh, 520px)`). The window/body must NEVER scroll or chain when cursor/touch is inside the results area.
   - Keyboard interaction: `Escape` immediately closes search; arrow key navigation / Enter navigates to item.
2. **Navigation & Header Ergonomics**:
   - Sticky header with high-blur backdrop (`backdrop-filter: blur(16px)` / `rgba(9,9,11,0.85)`).
   - Clear icon spacing with accessible hit targets (minimum `44x44px` touch targets).
   - Badge counts (Cart, Wishlist) must be compact, optically centered, and legible.
3. **Product Card Hierarchy**:
   - Primary: High-resolution footwear silhouette on neutral canvas.
   - Secondary: Model name (bold/medium), brand badge (subtle).
   - Tertiary: Price & retail compare price, discount percentage badge.
   - Quick action: Wishlist toggle and Add to Cart triggers with immediate tactile feedback.
4. **State Management**:
   - Explicit loading skeletons (no layout shift).
   - Graceful empty states with actionable search suggestions.
   - Error states with recovery actions.
5. **Mobile & Viewport Scaling**:
   - Mobile drawers with pull handles and smooth touch dismiss.
   - Prevent body scroll lock during open drawers/overlays.
