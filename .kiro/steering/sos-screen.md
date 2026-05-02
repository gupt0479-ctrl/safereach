---
inclusion: fileMatch
fileMatchPattern: "**/SosScreen*,**/communicationAgent*"
---

# SOS Screen — Emergency Mode

The SOS screen is the most critical screen in the app. It must work perfectly under stress.

## Structure (ALL always visible — no modals, no reveals)

1. **Current status card**: name, age, equipment, GPS, battery, transmission status
2. **Send Emergency SMS button**: red, full-width, min-h-btn-lg (64px)
3. **Emergency SMS content card**: ALWAYS VISIBLE, monospace, amber left border
4. **Three call buttons**: real `tel:` links — Shelter, Sarah, OEM
5. **Auto-ping status card**: green dot, last/next ping timestamps

## SMS Content Card

The SMS card must be ALWAYS visible on screen. Not in a modal. Not revealed after a button tap. The "Send Emergency SMS" button is the action. The SMS card is the content. Both are always on screen.

The SMS contains everything emergency services need before dispatch:
- Full name, age, gender
- Status: STRANDED
- Address + GPS coordinates
- All equipment with battery remaining
- Transport requirements (ADA-accessible vehicle, power wheelchair)
- Physical instructions to reach her (ramp on south side, cannot open door)
- Confirmed shelter with phone and generator status
- All emergency contacts
- SafeReach profile ID and reference code TXV-2847

## Auto-Navigation

App auto-navigates to SOS screen 1.5-2 seconds after "Storm Active" is triggered. This is handled in DemoContext via useEffect watching for DISASTER_ACTIVE mode.

## Send SMS Flow

1. User taps "Send Emergency SMS"
2. Button shows "Transmitting..." with spinner (2 second delay)
3. Button replaced with green confirmation: "✓ SMS Sent — Travis County OEM notified at 3:17 AM"
4. SMS card remains visible throughout

## Call Buttons

Three real `tel:` links, always visible:
- Call Shelter Directly — (512) 555-0311
- Call Sarah (Daughter) — (512) 555-0142
- Call Travis County OEM — (512) 555-9111
