# Implementation Plan - CSS Background Animation on CardPages

We will enhance the background of the `CardPages` component (located in `astro/src/components/react/ui/CardPages.jsx`) by adding a pure CSS floating/rotating box background animation on the right side. To keep the component clean, the styling will be placed in a separate CSS file: `CardPages.css`.

## User Review Required

> [!NOTE]
> The animation will be fully responsive and GPU-accelerated (using CSS transforms).
> It will automatically adjust its styling depending on whether the card page has a dark/gradient background or a light background to maintain clean aesthetics.

## Proposed Changes

### Web Frontend - Astro Component

---

#### [NEW] [CardPages.css](/astro/src/components/react/ui/CardPages.css)

Create a separate CSS file defining the keyframes and layout properties for the floating boxes.

- Position the animation container absolutely on the right side with `pointer-events: none` (to prevent blocking user interaction).
- Define floating box keyframes using GPU-accelerated `transform` (translating, scaling, and rotating).
- Style boxes with low-opacity white (`rgba(255, 255, 255, 0.08)`) for dark/gradient headers, and low-opacity primary color (`rgba(113, 107, 240, 0.05)`) for light/outline/label headers.
- Define 5 distinct floating boxes with randomized sizes, positions, animation durations, and delays to create an organic movement.

#### [MODIFY] [CardPages.jsx](/astro/src/components/react/ui/CardPages.jsx)

- Import the newly created `CardPages.css`.
- Add the markup for the background boxes container (`card-page-bg-animation` containing 5 `.bg-box` elements).
- Dynamically add a `light-theme` class if the variant is `light` or the header type is `outline` or `label`.
- Ensure the main content wrapper has `position: relative` and `z-index: 2` so it remains clearly readable and interactive above the animation.

## Verification Plan

### Automated Tests

- Run `npm run build` in the `astro` directory to ensure that Vite can bundle the local CSS import inside the React component successfully.

### Manual Verification

- Check all modified components to ensure they render correctly without formatting regressions.
- Verify that text in the header can still be highlighted/selected (confirming `z-index` and `pointer-events: none` are working properly).
