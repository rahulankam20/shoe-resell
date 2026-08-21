---
name: squeeze-motion
description: "Kinetic motion and micro-interaction design system for premium digital products. Focuses on restrained, high-performance, physics-grounded transitions (120ms-280ms), cubic-bezier easing, hardware-accelerated transforms/opacity, and accessible reduced-motion support."
---

# Squeeze Motion System

## Core Principles
1. **Purpose-Driven Animation**: Animate only to communicate spatial relationships, hierarchy, feedback, or state transitions. Never animate solely for decoration.
2. **Micro-Durations**:
   - Instant feedback (press/click): 100ms - 150ms
   - Small micro-interactions (hover, icon transitions, pill toggles): 160ms - 220ms
   - Modal/Panel reveals & drawer expansions: 240ms - 320ms
3. **Cubic-Bezier Easing Tokens**:
   - `--ease-out-editorial`: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy entry, gentle settle)
   - `--ease-in-out-smooth`: `cubic-bezier(0.65, 0, 0.35, 1)` (balanced state shifts)
   - `--ease-spring-squeeze`: `cubic-bezier(0.34, 1.56, 0.64, 1)` (subtle tactile feedback, < 4% overshoot)
4. **Hardware-Accelerated Properties Only**:
   - Transform (`translate3d`, `scale`, `rotate`)
   - Opacity
   - Avoid animating `width`, `height`, `top`, `margin`, or `padding` during interactive frames.
5. **Accessibility**: Always respect `@media (prefers-reduced-motion: reduce)` by reducing transitions to instantaneous opacity or 0ms duration.

## Checklist for Implementation
- [ ] Dropdowns & panels use `--ease-out-editorial` with subtle Y-offset (`-6px` to `0px`).
- [ ] Buttons have active `:active` compression (`transform: scale(0.98)`).
- [ ] Product image cards employ smooth hover scale (`transform: scale(1.03)` with `will-change: transform`).
- [ ] itsHover animated icons are tuned to match 180ms-240ms duration and smooth stroke/transform behavior.
