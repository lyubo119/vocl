# Project Style Guide

> **Single Source of Truth** for Design & UI/UX
> 
> *Last Updated: 2026-02-11*

This document defines the visual language of the **lash** project. It combines the technical precision of our SaaS platform with the premium, trust-building aesthetic of our agency services.

---

## 1. Color Palette

We use a dark-themed palette with subtle gradients and high-contrast text to convey professionalism and trust.

### CSS Variables

```css
:root {
  /* Backgrounds */
  --bg-primary: #020202;       /* Main background */
  --bg-header: #020205;        /* Header background */
  --bg-card: #101010;          /* Darker card background */
  --bg-card-contrast: #4b4b51; /* Contrast card background */
  --bg-card-solution: #bfbfbf; /* Solution card background */
  --bg-button-sub: #1f1f1f;    /* Secondary button background */
  --bg-mockup: #060606;        /* Screen mockup background */

  /* Text Colors */
  --text-primary: #ffffff;     /* Main headings, primary content */
  --text-secondary: #9ca3af;   /* Supplemental text */
  --text-subheading: #cccccc;  /* Subheadings */
  --text-button: #1a1a1a;      /* Text inside white buttons */
  --text-cta-unfocused: #b4b4b4;
  --text-card-accent: #e1e1e7;

  /* Accents & UI Elements */
  --accent-purple: #d1a0d7;    /* Categorization tags */
  --border-nav: #808080;       /* Upper nav border */
  --divider: #2b2b2b;          /* Dividers (gradient overlay) */
  --inactive-logo: #4e4e4e;
  
  /* Interactions */
  --hover-link-bg: #cdcdcd;    /* Hover background for main links */

  /* System / Mac UI accents (for mockups) */
  --mac-red: #fbfbfb;          /* Close circle (custom style) */
  --mac-yellow: #f5c42f;       /* Minimize circle */
  --mac-green: #70cc81;        /* Maximize circle */
}
```

### Usage Guidelines
*   **Backgrounds**: Always start with `--bg-primary` (#020202). Add subtle noise texture for depth.
*   **Text Hierarchy**: Use `--text-primary` for H1/H2. Use `--text-subheading` for introductory text. Use `--text-secondary` for body paragraphs to reduce eye strain.
*   **Accents**: Use `--accent-purple` sparingly for tags or small highlights to break the monochrome.

---

## 2. Typography

We use a combination of **Aeonik** (headings, technical) and **Inter** (body, UI) to achieve a "tech-forward" look. **Geist** is used for small uppercase details.

### Font Families
```css
:root {
  --font-display: 'Aeonik', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'Geist', monospace; /* Used for small uppercase stats/labels */
}
```

### Type Scale & Rules

| Element | Font family | Size | Weight | Line Height | Tracking | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 (Hero)** | Aeonik | 4.5rem | 500 | 1.25em | Normal | Margin bottom: 90px |
| **H2** | Aeonik | 1.875rem | 400 | Normal | Normal | Margin: 90px vertical |
| **H3** | Inter | 1.25rem | 400 | 1.5rem | Normal | |
| **Subheading** | Inter | 1.125rem | 400 | 1.65rem | Normal | Margin bottom: 20px |
| **Body (p)** | Inter | 1rem | 400 | 1.5rem | Normal | Margin bottom: 32px |
| **Button Text** | Inter | 0.8125rem–0.875rem | 500 | Normal | Normal | Title case, 0.2s transition |
| **Footer Head** | Aeonik | 0.75rem | 500 | Normal | 0.1em | Uppercase |
| **Small Caps** | Geist | 0.75rem | 300-400 | 1.5rem | 2px | Uppercase |

---

## 3. Spacing & Layout

### The "Squircle"
Consistent with Apple's design language, all cards, buttons, and containers should use **super-ellipses** (squircles) instead of standard border-radius.
*   **Corner Smoothing**: 60% (if utilizing Figma/CSS Houdini) or approximate with `border-radius: 12px` to `24px` depending on size.

### Spacing System (4pt Grid)
*   **XS**: 4px
*   **S**: 8px
*   **M**: 16px
*   **L**: 32px
*   **XL**: 64px
*   **XXL**: 96px (Close to 90px used for H1/H2 margins)

### Responsive Breakpoints
*   **Mobile**: < 768px
*   **Tablet**: 768px - 1024px
*   **Desktop**: > 1024px

---

## 4. Component Patterns

### Buttons
1.  **Primary Button**:
    *   Background: `#ffffff`
    *   Text: `#1a1a1a`
    *   Style: Rounded (squircle), title case text, compact height (36–40px).
    *   Hover: Slight scale up or brightness shift, subtle arrow nudge.
2.  **Secondary / Sub-button**:
    *   Background: `#1f1f1f`
    *   Text: `#ffffff`
    *   Border: None.
    *   Shares the same arrow pattern and corner radius as primary.

### Cards
*   **Standard Card**: Dark grey (`#101010`) background, no border.
*   **Contrast Card**: Lighter grey (`#4b4b51`) for emphasis.
*   **Solution Card**: Light grey (`#bfbfbf`) for specific solution blocks.
*   **Effects**: All cards should have a subtle inner glow or gradient overlay to separate them from the background.

### Navigation Bar
*   Background: `#020205`
*   Border: 1px solid `--border-nav` (`#808080`) at the top (if bottom navigation) or bottom.
*   Links: Inter, 0.75rem.
*   Primary nav CTA: white squircle with compact height, arrow on the right mirroring primary buttons.

---

## 5. Visual Effects

### Glows & Gradients
*   **Subtle Glow**: Use gentle radial gradients behind key elements to create depth.
    *   *Example*: `background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%);`
*   **Noise**: Apply a low-opacity noise texture overlay on the main background `#020202` to prevent banding and add organic feel.

### Animations
*   **Micro-interactions**: 0.2s ease-out for hover states (buttons, links).
*   **Touch Feedback**: For mobile and tablet devices, use the `active:` variant to match the desktop `hover:` behavior (color shift + arrow nudge) to provide immediate tactile feedback on tap.
*   **Transitions**: Smooth fades for modal overlays and page transitions.

---

## Changelog

| Date | Author | Description |
| :--- | :--- | :--- |
| 2026-02-09 | AI Assistant | Initial creation based on Product Brief and Moodboard |
| 2026-02-11 | AI Assistant | Footer + tab branding updates and alignment with Terms/Privacy links. |
| 2026-02-11 | AI Assistant | Refined primary/secondary button sizing and casing to match Scale-style moodboard while keeping squircle geometry. |
| 2026-02-11 | AI Assistant | Updated primary button text color to `#1a1a1a` and aligned secondary buttons to link-style CTAs without background/border to match Navbar CTA implementation. |
| 2026-02-12 | AI Assistant | Synchronized `active` states with `hover` behavior (brightness/color + arrow nudge) for consistent mobile/tablet feedback. |

