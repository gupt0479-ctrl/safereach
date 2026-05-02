import { Map as MapIcon, Hospital, Siren, User } from "lucide-react";
import { useDemo, type ViewState } from "@/context/DemoContext";
import { cn } from "@/lib/utils";

const TABS: { id: ViewState; label: string; Icon: typeof MapIcon }[] = [
  { id: "map", label: "Map", Icon: MapIcon },
  { id: "shelter", label: "My Shelter", Icon: Hospital },
  { id: "sos", label: "S.O.S", Icon: Siren },
  { id: "profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const { view, setView } = useDemo();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-surface bg-navy"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-tap flex-col items-center justify-center gap-0.5 text-[12px] font-semibold transition-colors",
              active ? "text-amber" : "text-muted-foreground",
            )}
          >
            <Icon className="h-6 w-6" aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
