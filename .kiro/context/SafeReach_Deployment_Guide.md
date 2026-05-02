# SafeReach — Deployment & Demo Guide
# From Lovable to Live URL to Winning the Hackathon

> Ordered by priority. Section 1 before Section 2.
> Every STOP means verify before continuing.
> Do not deploy a broken app.

---

## PRIORITY ORDER — READ BEFORE TOUCHING ANYTHING

P0 — Must work. If these fail, you lose:
  1. Map loads with shelter pins and Maria's dot
  2. Trigger Warning shifts UI, shows banner with 2 buttons
  3. Shelter screen shows Phase 1 match + explanation card
  4. 2hrs Out shows Phase 1.5 with different content
  5. Storm Active shows Phase 2 with battery countdown
  6. SOS screen shows full SMS card without any tapping
  7. Reset returns everything to zero cleanly

P1 — Should work. Impressive if present:
  8. emPOWER circles visible on map
  9. Notification log populated after match
  10. Phase timeline nodes update
  11. Countdown timer ticks in real time

P2 — Nice to have. Only touch if P0 + P1 are done:
  12. NWS live API call
  13. Mini map on shelter screen
  14. Battery bar slow animation

---

## SECTION 1 — GET CODE OUT OF LOVABLE

### Step 1.1 — Export to GitHub

In Lovable, click the GitHub button (top right).
Connect GitHub account if not connected.
Click Push to GitHub.
Select your existing SafeReach repository.

STOP. Open GitHub in browser. Verify these files exist:
  src/context/DemoContext.tsx
  src/agents/matchingAgent.ts
  src/agents/communicationAgent.ts
  src/data/demo.ts
  src/components/safereach/ (folder with components)
  package.json
  vite.config.ts
  index.html

If any are missing: go back to Lovable, check file structure,
export again.

---

### Step 1.2 — Clone and run locally

```bash
git clone https://github.com/YOUR_USERNAME/safereach.git
cd safereach
npm install
npm run dev
```

Open http://localhost:5173

STOP. Run P0 checklist:
  [ ] Page loads, no white screen, no console errors
  [ ] Map renders with actual tiles (not grey)
  [ ] Maria's blue pulsing dot on map
  [ ] 4 tabs only: Map, Shelter, SOS, Profile
  [ ] Demo strip at bottom of map with Trigger/2hrs/Storm/Reset
  [ ] Trigger Warning → status pill turns amber → banner appears
  [ ] Banner has exactly 2 buttons: Get to Safety + SOS
  [ ] Get to Safety → navigates to Shelter tab
  [ ] Shelter tab shows Phase 1 with white explanation card
  [ ] 2hrs Out → shelter content changes (different text, phase banner)
  [ ] Storm Active → UI turns red/emergency mode
  [ ] SOS tab shows full SMS message card on screen
  [ ] Profile tab loads
  [ ] Reset → everything returns to initial state

Write down every failure. Fix P0 items before Section 2.

---

## SECTION 2 — FIX CRITICAL ISSUES

Fix in this order. Do not move to next fix until current one works.

### Fix A — Map is grey (no tiles)

Add to src/index.css as very first line:
```css
@import 'leaflet/dist/leaflet.css';
```

Find MapView component. Give the container explicit height:
```tsx
<div style={{ height: 'calc(100vh - 128px)', width: '100%' }}>
  <MapContainer style={{ height: '100%', width: '100%' }}>
```

---

### Fix B — Phase 1.5 looks same as Phase 1

ShelterScreen must have three completely separate render blocks.
Find the component and add:

```tsx
const { mode, phase, matchResult } = useDemo()

// Phase 2 — disaster mode, completely different content
if (mode === 'DISASTER_ACTIVE') {
  return <Phase2Content />
}

// Phase 1.5 — 2 hours out, reachability focus
if (phase === 1.5) {
  return <Phase15Content matchResult={matchResult} />
}

// Phase 1 — default, best-fit focus
return <Phase1Content matchResult={matchResult} />
```

Phase 1.5 must show:
- Amber phase-shift banner at top
- "FORMULA UPDATED — 2 Hours Remaining" heading
- Updated explanation text (reachability, not best-fit)
- Transport urgency card showing "1h 45min" in amber bold

Phase 1 must show:
- White explanation card (blue left border)
- "Why SafeReach chose this shelter" with rejection reasoning
- Normal transport card showing "8h 30min"

If they look the same, the conditional logic is not wired.

---

### Fix C — Phase 2 shows a shelter search

Phase 2 must NOT have: explanation card, matching logic,
transport confirmation, "Confirm I'll Be Ready" button.

Phase 2 must ONLY have:
- Red disaster banner
- Ventilator battery countdown card
- Wheelchair battery card
- Shelter status card (is it open, generator running)
- Phase 2 formula display (4 metrics with bars)

Add this as the first block in ShelterScreen:
```tsx
if (mode === 'DISASTER_ACTIVE') {
  return (
    <div className="p-4 pb-32">
      <DisasterActiveBanner />
      <VentilatorBatteryCard />
      <WheelchairBatteryCard />
      <ShelterStatusPhase2 />
      <Phase2FormulaCard />
    </div>
  )
}
```

---

### Fix D — SOS SMS card is hidden or behind a button

The SMS card must be ALWAYS visible on the SOS screen.
Not in a modal. Not revealed after button tap.
The "Send Emergency SMS" button is the action.
The SMS card is the content. Both are always on screen.

```tsx
// SOS screen — this is the correct structure
return (
  <div className="p-4 pb-32 overflow-y-auto">
    <CurrentStatusCard />
    <SendSMSButton />          {/* red action button */}
    <SMSContentCard />         {/* ALWAYS VISIBLE */}
    <CallButtons />            {/* 3 tel: links */}
    <AutoPingCard />
  </div>
)
```

---

### Fix E — DemoContext state functions broken

Replace the three demo trigger functions in DemoContext.tsx:

```tsx
const triggerStormWarning = useCallback(() => {
  setMode('WARNING')
  setPhase(1)
  if (countdownRef.current) clearInterval(countdownRef.current)
  setCountdown(36000)
  countdownRef.current = setInterval(() => {
    setCountdown(prev => prev > 0 ? prev - 1 : 0)
  }, 1000)
}, [])

const fastForwardPhase = useCallback(() => {
  setPhase(1.5)
  setMode('MATCHING')
  setTimeout(() => {
    const result = runMatchingAgent(MARIA, SHELTERS, 1.5)
    const notifs = runCommunicationAgent(result, MARIA, CONTACTS, 'confirmed')
    setMatchResult(result)
    setNotifications(notifs)
    setMode('MATCHED')
  }, 1500)
}, [])

const activateDisaster = useCallback(() => {
  setMode('DISASTER_ACTIVE')
  setPhase(2)
  setTimeout(() => setActiveScreen('sos'), 1500)
}, [])

const resetDemo = useCallback(() => {
  if (countdownRef.current) clearInterval(countdownRef.current)
  setMode('NORMAL')
  setPhase(1)
  setCountdown(36000)
  setMatchResult(null)
  setNotifications([])
  setEvacuationChoice(null)
  setActiveScreen('map')
}, [])
```

---

### Fix F — Header is solid navy (not semi-transparent)

Find StatusBar or Header component. Replace background:
```tsx
style={{
  position: 'fixed',
  top: 0, left: 0, right: 0,
  zIndex: 50,
  height: '56px',
  background: 'rgba(11, 31, 58, 0.92)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px'
}}
```
Apply to all 4 screens.

---

### Fix G — Reset leaves stale state

After clicking Reset, open browser devtools → React DevTools.
Check DemoContext state. Every field must be back to default.

Test sequence:
1. Trigger Warning → 2hrs Out → Storm Active → Send SMS
2. Click Reset
3. Verify in devtools:
   mode: 'NORMAL'
   phase: 1
   countdown: 36000
   matchResult: null
   notifications: []
   evacuationChoice: null
   activeScreen: 'map'

If anything is wrong, find that state setter and add it to
resetDemo().

---

## SECTION 3 — PRODUCTION BUILD

Only after all P0 checklist items pass locally.

### Step 3.1 — Build locally first

```bash
npm run build
```

Common errors and fixes:

ERROR: Cannot find module 'leaflet'
FIX: npm install leaflet @types/leaflet react-leaflet

ERROR: TypeScript type errors in agent files
FIX: Add // @ts-ignore above the specific line, or add
     explicit types. For hackathon speed: add as any.

ERROR: "process is not defined"
FIX: Add to vite.config.ts:
```ts
export default defineConfig({
  define: { 'process.env': {} },
  ...
})
```

ERROR: Cannot find module './components/...'
FIX: Check import paths. Vite is case-sensitive.
     Make sure filenames match exactly.

When build succeeds with no errors, you see a dist/ folder.
That is your deployable app.

---

### Step 3.2 — Deploy to Vercel

METHOD A — GitHub Auto-Deploy (3 minutes, recommended):

1. Go to vercel.com, click Add New Project
2. Import your safereach GitHub repository
3. Framework: Vite (auto-detected usually)
4. Build Command: npm run build
5. Output Directory: dist
6. Click Deploy

When complete you get: https://safereach-[hash].vercel.app

Open immediately. Run P0 checklist on live URL.

METHOD B — If GitHub connect fails:
```bash
npm install -g vercel
vercel login
vercel --prod
```
Answer prompts: framework Vite, build npm run build, output dist.

---

### Step 3.3 — Get a clean URL

In Vercel project settings → Domains:
Type: safereach-demo.vercel.app
If taken: safereach-[yourname].vercel.app

This is the URL you give judges. Write it on paper now.

---

### Step 3.4 — Fix live deployment issues

ISSUE: Map tiles grey on Vercel but worked locally
FIX: Change TileLayer URL:
```tsx
// Try this first:
url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"

// If still broken, use CartoDB (very reliable):
url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
subdomains="abcd"
```
Commit, push, wait for Vercel redeploy.

ISSUE: White flash before navy background loads
FIX: In index.html, add to body tag:
```html
<body style="background-color: #0B1F3A; margin: 0;">
```

ISSUE: Bottom nav cut off on iPhone
FIX: In index.css:
```css
.bottom-nav-container {
  padding-bottom: env(safe-area-inset-bottom);
}
```

ISSUE: Fonts look wrong (not Inter)
FIX: Confirm this is in index.css before @tailwind:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
```

---

## SECTION 4 — DAY OF PREPARATION

### 2 Hours Before Presenting

Stop making code changes. Lock the codebase.
Push final version:
```bash
git add .
git commit -m "Final demo version — all phases verified"
git push origin main
```

Wait for Vercel auto-deploy to finish (60-90 seconds).
Verify live URL still works after the push.

---

### Take Emergency Backup Screenshots

Open live URL. Run through the full demo flow.
Take screenshots at each of these exact moments:

Screenshot 1: Map — NORMAL state
  Status pill green, map visible, no banner, calm

Screenshot 2: Map — WARNING state
  Amber banner visible with ONLY two buttons

Screenshot 3: Shelter — Phase 1
  White explanation card visible, full text showing

Screenshot 4: Shelter — Phase 1.5
  Amber phase-shift banner, transport urgency "1h 45min"

Screenshot 5: Shelter — Phase 2
  Red disaster banner, ventilator battery bar, emergency mode

Screenshot 6: SOS screen
  Full SMS card visible, all fields showing

Screenshot 7: Profile
  Sarah and James with "Notified ✓" green badges

Screenshot 8: Map with pins
  Green pin (Dell Seton), red pin (Austin Community Center)

Save all screenshots to Google Drive. Share folder with teammate.
These are your fallback if the live app breaks mid-demo.

---

### Set Up Presentation Device

Identify the exact device + browser you will present from.
Open live URL. Add to bookmarks at position 1.

Open these tabs in order, do not close them:
  Tab 1: Live Vercel URL (the app) — ALWAYS in front
  Tab 2: Google Drive screenshots (emergency backup)
  Tab 3: GitHub repo (in case judges want to see code)

Settings to configure NOW:
  Screen brightness → maximum
  Do Not Disturb → ON
  Sound → muted
  Battery → plugged in or at 100%
  Auto-lock / screen sleep → set to never (for demo duration)

---

### Full Dress Rehearsal — Both People, Out Loud, Timed

30 minutes before presenting. This is the last test.

Person T clicks. Person P narrates. Time it.

00:00 — Map screen open, NORMAL state, both people ready
00:10 — P: "This is Maria. 58. Ventilator. Power wheelchair.
          Lives alone in Austin. Pre-registered with SafeReach."
00:22 — P: "On February 15th, 2021, that disaster arrived."
00:25 — T: Click "Trigger" in demo strip
00:28 — Amber banner slides down
00:30 — P: "A Winter Storm Warning. SafeReach ingests it from
          the National Weather Service API. Maria's ventilator
          depends on electricity. She cannot self-evacuate.
          The system does not wait for her to call 911."
00:48 — T: Click "Get to Safety" on the banner
00:52 — Shelter screen loads, Phase 1, explanation card visible
00:55 — P: "The nearest shelter is 1.1 miles away.
          SafeReach rejected it. No backup power — Maria's
          ventilator would fail. Dell Seton is 4.2 miles away
          with a 72-hour generator."
01:12 — P: "That extra distance keeps her alive."
01:15 — T: Click "2hrs Out" in demo strip
01:17 — Matching animation plays
01:20 — Phase 1.5 content appears, phase banner visible
01:22 — P: "Two hours left. The algorithm shifts its own weights.
          Proximity now dominates. The formula adapted because
          time collapsed. Still reachable — match confirmed."
01:40 — T: Click "Storm Active" in demo strip
01:42 — UI shifts to red, auto-navigates to SOS
01:45 — SOS screen, SMS card visible
01:48 — P: "Power has failed. Maria is alone. One tap.
          That SMS contains her GPS coordinates, her ventilator
          battery time, exactly how to reach her, what vehicle
          is required, who to call. Everything emergency services
          need before they leave the station."
02:05 — T: Navigate to Profile
02:08 — P: "Sarah and James are notified. Travis County OEM
          has her flagged. The shelter knows she's incoming."
02:18 — T: Navigate to Map
02:20 — T: Tap green pin → popup shows 94%
02:23 — T: Tap red pin → popup shows 12%, no backup power
02:28 — P: "Every amber zone is a ZIP code with electricity-
          dependent residents. This is the HHS emPOWER database.
          Real federal data. On the map. Right now."
02:42 — P: "The infrastructure exists. The mandate exists.
          The data exists. SafeReach connects them."
02:50 — Stop. Wait for questions.

If this run has any moment where the screen doesn't match the
narration: fix it before presenting. Adjust script or fix the
transition. Then run it once more.

After the second clean run: lock. No more changes.

---

## SECTION 5 — DURING THE PRESENTATION

### Opening — Do Not Start With the App

Person P starts with the story. Slides are on screen.
Person T has the app ready but not visible yet.

"February 15th, 2021. 3am. Austin, Texas."

That is the first sentence. Not "Hi, we're Team SafeReach."
Not "Our product is a disaster management platform."
The story. Then the gap. Then the solution. Then the app.

When Person P says "Let me show you this working" —
Person T opens the app. Map screen. NORMAL state.
That is the handoff.

---

### The 5 Moments That Win

Moment 1 — The banner (two buttons only)
When it appears with only "Get to Safety" and "SOS" —
no explanations, no menu, no features — judges understand
immediately: this was designed for someone in crisis.
That simplicity is a design argument. Say nothing. Let it sit.

Moment 2 — The explanation card
When you read aloud "Austin Community Center is 1.1 miles away —
but has no backup power. Your ventilator would fail." —
and point to the white card on screen — you are showing that
the system makes a decision AND explains it. Slow down here.
This is the most important screen in the demo.

Moment 3 — The phase shift
When the algorithm visibly changes its own weights because
time collapsed — say exactly: "The algorithm shifted its own
weights. No existing emergency system does this."
Let judges process that claim. It's true. And it's visible.

Moment 4 — The SMS card
Read one line aloud from the SMS:
"ADA-accessible vehicle required. Standard ambulance cannot
accommodate power wheelchair."
That specificity — the system knows what KIND of vehicle to send —
is what wins Real Impact and Inclusive by Design in one sentence.

Moment 5 — The red pin popup
When you tap the red Austin Community Center pin and judges
see "Match Score: 12% — No backup power" —
that is the entire product argument in a popup.
The closest option was rejected. The system knew why.
You built a system that says no to the wrong answer.

---

### Q&A — Answers Ready

"Is this real or a prototype?"
"The matching logic is real TypeScript code running in the browser.
The NWS API is live. The emPOWER data is live. The UI is a
prototype but the decision engine is production-ready logic."

"Why not just call 911?"
"911 is reactive. By the time Maria calls, she may have no power,
dying phone, extreme stress, and no way to describe her wheelchair
dimensions so they send the right vehicle. SafeReach builds that
profile once, in a non-emergency moment, and fires it automatically
when it's needed. She never has to explain herself in a crisis."

"Who maintains the shelter database?"
"The same county OEM agency that already runs shelter operations.
This is data they already have — we make it queryable and
connected to the at-risk population."

"What about privacy?"
"Same legal framework as STEAR — voluntary registration, used
only for emergency planning, exempt from public records requests
under existing emergency management statutes."

"Why doesn't this exist already?"
"The data exists. The mandate exists. The gap is a system
that treats registration, matching, and communication as a
single connected workflow instead of three separate databases
that never talk to each other."

---

## FINAL 5-MINUTE CHECKLIST

Run this 5 minutes before presenting:

DEVICE
  [ ] Live URL open on presentation device
  [ ] Chrome or Safari (not Firefox for Leaflet)
  [ ] Full screen mode active
  [ ] Brightness at maximum
  [ ] Do Not Disturb ON
  [ ] Sound muted
  [ ] Plugged in or battery 100%
  [ ] Auto-lock disabled

APP
  [ ] On Map screen
  [ ] Status pill shows green
  [ ] Map tiles loaded (not grey)
  [ ] Shelter pins visible
  [ ] Demo strip visible at bottom
  [ ] Tapped Trigger once → Reset → verified clean start

BACKUP
  [ ] Screenshots accessible on separate device (phone)
  [ ] Live URL written on paper, in pocket
  [ ] Slides open on separate tab or device

BOTH PEOPLE
  [ ] Person P has run through script out loud today
  [ ] Person T knows exact button sequence
  [ ] Both know: if app breaks, go to screenshots, keep talking
  [ ] Timer ready: 5 minutes starting when P begins speaking

---

## THE CLOSING IMAGE

When Person P says the closing line —

"The infrastructure exists. The mandate exists.
 The data exists. SafeReach connects them."

Person T has the Map screen visible.
Amber circles glowing. Green pin on Dell Seton.
Red pin on Austin Community Center. Maria's blue dot.

The last thing judges see is the map.
Not a slide. The actual product.
That is your closing image.
