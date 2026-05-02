---
inclusion: fileMatch
fileMatchPattern: "**/index.css,**/tailwind.config*"
---

# SafeReach Design Token Reference

## Color Palette (HSL values in CSS custom properties)

| Token | HSL | Hex | Usage |
|---|---|---|---|
| --navy | 214 69% 13% | #0B1F3A | Background |
| --surface | 215 56% 18% | #132744 | Cards |
| --amber | 35 91% 55% | #F5A623 | Warning state |
| --danger | 7 65% 55% | #D94F3D | Emergency/danger |
| --safe | 145 63% 49% | #2ECC71 | Confirmed/safe |
| --info | 217 91% 60% | #3B82F6 | Blue accent |
| --muted-text | 211 18% 62% | #8A9BB0 | Secondary text |

## Typography

| Token | Size | Usage |
|---|---|---|
| font-min | 16px | Absolute minimum |
| font-body / text-body | 18px | Default body text |
| font-heading / text-heading | 24px | Section headings |
| font-alert / text-alert | 32px | Emergency alerts |
| text-label | 14px | Labels, metadata |

Font family: Inter (loaded from Google Fonts), fallback to system-ui.

## Spacing & Sizing

| Token | Value | Usage |
|---|---|---|
| min-h-tap | 48px | Minimum tap target |
| min-h-btn | 56px | Standard buttons |
| min-h-btn-lg | 64px | Large/primary buttons |
| rounded-card | 12px | Card border radius |

## Mode Tints (applied via CSS class on root container)

- `.mode-warning`: subtle amber overlay
- `.mode-emergency`: subtle red overlay

## Header (every screen)

```css
background: rgba(11, 31, 58, 0.92);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border-bottom: 1px solid rgba(255, 255, 255, 0.06);
```
