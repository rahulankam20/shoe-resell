---
name: impeccable
description: "Zero-defect visual design quality assurance system. Enforces micro-alignment, optical balance, subpixel layout stability, typography vertical rhythm, color contrast standards, and responsive viewport validation across 375px, 768px, 1024px, 1280px, and 1440px."
---

# Impeccable: Visual Quality Assurance & Polish

## Quality Checklist
1. **Alignment & Grid**:
   - Every element must align to a consistent 4px/8px layout grid.
   - Text baselines and icons must be optically centered (use `flex items-center` with `gap` instead of arbitrary margins).
   - No 1px clipping or awkward overflow horizontal scrollbars on mobile.
2. **Typography & Hierarchy**:
   - Contrast ratio ≥ 4.5:1 for body text and ≥ 3:1 for large display headings (WCAG AA).
   - Consistent font stack across all pages (Primary: Inter / Syne / Space Grotesk / system sans).
   - No orphaned single-word lines in key hero headings.
3. **Interactive Polish**:
   - All interactive controls (`<button>`, `<a>`, `<input>`) have distinct `:hover`, `:focus-visible`, and `:active` states.
   - Focus rings use high-contrast outline (`outline: 2px solid #ffffff; outline-offset: 2px`).
   - Active compression and hover elevation must be consistent across cards and buttons.
4. **Scroll & Boundary Validation**:
   - Nested scrollable containers (Search results dropdown, Cart drawer, Filter sheet) MUST have `overscroll-behavior: contain`.
   - Prevent background page jank during wheel/touch actions.
   - Smooth custom scrollbars for dark-mode aesthetic (`scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent`).
5. **Cross-Breakpoint Verification**:
   - Test layout at 375px (iPhone SE), 390px (iPhone 14/15), 768px (iPad Mini), 1024px (iPad Pro), 1280px, 1440px (MacBook / Desktop).
