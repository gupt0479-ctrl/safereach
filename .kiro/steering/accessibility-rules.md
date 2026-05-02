---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---

# SafeReach Accessibility Rules

These rules are non-negotiable. SafeReach is designed for people with disabilities in crisis situations.

## Visual
- No color-only communication — ALWAYS pair color with icon + text
- Minimum contrast ratio 4.5:1 against navy (#0B1F3A) background
- Font minimum: 16px. Body: 18px. Heading: 24px. Alert: 32px.
- Status indicators must use icon + text + color (e.g., "✓ Normal" with green, not just green dot)

## Interactive
- Minimum tap target: 48px (`min-h-tap` in Tailwind config)
- Buttons: 56px (`min-h-btn`) or 64px (`min-h-btn-lg`) for primary actions
- All buttons must have visible text labels (not icon-only without aria-label)
- ARIA labels on all interactive elements
- Phone numbers must be real `tel:` links — never plain text

## Content
- No audio-only content — Maria's communication mode is large_text
- SMS card on SOS screen must be ALWAYS VISIBLE — not behind a modal or button tap
- Alert text must be clear, short, and actionable
- Emergency information must be scannable (not buried in paragraphs)

## Component Patterns
```tsx
// GOOD — color + icon + text
<span className="text-safe">✓ Confirmed</span>

// BAD — color only
<span className="text-safe">●</span>

// GOOD — proper tap target with aria-label
<button className="min-h-tap" aria-label="Call shelter">
  <Phone /> (512) 555-0311
</button>

// BAD — tiny target, no label
<button onClick={call}><Phone /></button>
```

## Header Rule
Every screen must have the semi-transparent header:
```
background: rgba(11, 31, 58, 0.92)
backdrop-filter: blur(12px)
border-bottom: 1px solid rgba(255,255,255,0.06)
```
Never solid navy. Always semi-transparent with blur.
