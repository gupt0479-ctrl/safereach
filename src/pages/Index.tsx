import { DemoProvider, useDemo } from "@/context/DemoContext";
import { BottomNav } from "@/components/safereach/BottomNav";
import { HomeScreen } from "@/components/safereach/HomeScreen";
import { MapScreen } from "@/components/safereach/MapScreen";
import { ShelterScreen } from "@/components/safereach/ShelterScreen";
import { SosScreen } from "@/components/safereach/SosScreen";
import { ProfileScreen } from "@/components/safereach/ProfileScreen";
import { cn } from "@/lib/utils";

function GlobalDemoStrip() {
  const { mode, setMode, setView, runMatch, reset, phase, setPhase, view } = useDemo();

  if (view === "map") return null;

  const triggerWarning = () => {
    if (mode === "NORMAL") {
      setMode("WARNING");
      setView("map");
    }
  };
  const twoOut = () => {
    if (mode === "NORMAL") return;
    setPhase(1.5);
    runMatch(1.5);
    setView("shelter");
  };
  const stormActive = () => {
    if (mode === "NORMAL") return;
    setPhase(2);
    setMode("DISASTER_ACTIVE");
    setView("sos");
  };

  const canFF = mode !== "NORMAL";
  const canStorm = mode !== "NORMAL" && phase >= 1.5;

  return (
    <div
      className="fixed inset-x-0 z-[490] flex items-center gap-1 bg-amber/95 px-2 py-1.5"
      style={{ bottom: `calc(64px + env(safe-area-inset-bottom))`, minHeight: 48 }}
    >
      <button
        onClick={triggerWarning}
        disabled={mode !== "NORMAL"}
        className="min-h-[48px] flex-1 rounded-card bg-navy px-2 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        🌨 Trigger Warning
      </button>
      <button
        onClick={twoOut}
        disabled={!canFF}
        className="min-h-[48px] flex-1 rounded-card bg-navy px-2 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        ⏩ 2hrs Out
      </button>
      <button
        onClick={stormActive}
        disabled={!canStorm}
        className="min-h-[48px] flex-1 rounded-card bg-danger px-2 py-2 text-[12px] font-bold text-white disabled:opacity-50"
      >
        ⚡ Storm Active
      </button>
      <button
        onClick={reset}
        className="min-h-[48px] min-w-[48px] rounded-card bg-navy/40 px-2 py-2 text-[12px] font-bold text-white"
        aria-label="Reset demo"
      >
        ↺
      </button>
    </div>
  );
}

function Shell() {
  const { view, mode, landingDismissed } = useDemo();

  const tint =
    mode === "DISASTER_ACTIVE"
      ? "mode-emergency"
      : mode === "WARNING" || mode === "MATCHING" || mode === "MATCHED"
        ? "mode-warning"
        : "";

  const isMap = view === "map";

  return (
    <div className={cn("relative flex min-h-screen flex-col bg-background", tint)}>
      <main
        className="relative flex-1"
        style={{
          paddingBottom: isMap ? undefined : `calc(112px + env(safe-area-inset-bottom))`,
        }}
      >
        {isMap && (
          <div className="absolute inset-0 bottom-[calc(64px+env(safe-area-inset-bottom))]">
            <MapScreen />
          </div>
        )}
        {view === "shelter" && <ShelterScreen />}
        {view === "sos" && <SosScreen />}
        {view === "profile" && <ProfileScreen />}
      </main>

      <GlobalDemoStrip />
      <BottomNav />

      {!landingDismissed && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-background">
          <HomeScreen />
        </div>
      )}
    </div>
  );
}

const Index = () => (
  <DemoProvider>
    <Shell />
  </DemoProvider>
);

export default Index;
