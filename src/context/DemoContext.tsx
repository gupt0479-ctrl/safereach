import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CONTACTS, MARIA, SHELTERS } from "@/data/demo";
import {
  runMatchingAgent,
  type MatchResult,
  type Phase,
} from "@/agents/matchingAgent";
import {
  runCommunicationAgent,
  type Notification,
} from "@/agents/communicationAgent";

export type AppMode =
  | "NORMAL"
  | "WARNING"
  | "MATCHING"
  | "MATCHED"
  | "EVACUATING"
  | "CANNOT_EVACUATE"
  | "DISASTER_ACTIVE";

export type ViewState = "map" | "shelter" | "sos" | "profile";

interface DemoContextType {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  phase: Phase;
  setPhase: (p: Phase) => void;
  countdown: number;
  matchResult: MatchResult | null;
  notifications: Notification[];
  evacuationChoice: "confirmed" | "cannot" | null;
  setEvacuationChoice: (c: "confirmed" | "cannot") => void;
  runMatch: (phase: Phase) => void;
  view: ViewState;
  setView: (v: ViewState) => void;
  reset: () => void;
  smsSent: boolean;
  sendSos: () => void;
  transportAvailable: boolean;
  setTransportAvailable: (v: boolean) => void;
  checkedIn: boolean;
  setCheckedIn: (v: boolean) => void;
  transportConfirmed: boolean;
  setTransportConfirmed: (v: boolean) => void;
  appendNotification: (n: Notification) => void;
  landingDismissed: boolean;
  dismissLanding: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

const INITIAL_COUNTDOWN = 10 * 60 * 60; // 10 hours

export function DemoProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("NORMAL");
  const [phase, setPhase] = useState<Phase>(1);
  const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [evacuationChoice, setEvacuationChoiceState] = useState<
    "confirmed" | "cannot" | null
  >(null);
  const [view, setView] = useState<ViewState>("map");
  const [smsSent, setSmsSent] = useState(false);
  const [transportAvailable, setTransportAvailable] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [transportConfirmed, setTransportConfirmed] = useState(false);
  const [landingDismissed, setLandingDismissed] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const dismissLanding = useCallback(() => setLandingDismissed(true), []);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    if (m === "WARNING") setCountdown(INITIAL_COUNTDOWN);
    if (m === "DISASTER_ACTIVE") setCountdown(0);
  }, []);

  // countdown ticking during active disaster modes
  useEffect(() => {
    const ticking =
      mode === "WARNING" ||
      mode === "MATCHING" ||
      mode === "MATCHED" ||
      mode === "EVACUATING";
    if (!ticking) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [mode]);

  const runMatch = useCallback(
    (p: Phase) => {
      setModeState("MATCHING");
      setPhase(p);
      window.setTimeout(async () => {
        const result = runMatchingAgent(MARIA, SHELTERS, p);
        setMatchResult(result);
        setModeState("MATCHED");
        const commResult = await runCommunicationAgent(
          result,
          MARIA,
          CONTACTS,
          evacuationChoice,
        );
        setNotifications(commResult.notifications);
      }, 1500);
    },
    [evacuationChoice],
  );

  const setEvacuationChoice = useCallback((c: "confirmed" | "cannot") => {
    setEvacuationChoiceState(c);
  }, []);

  const sendSos = useCallback(() => {
    setSmsSent(true);
  }, []);

  const appendNotification = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev]);
  }, []);

  // Auto-navigate to SOS when disaster becomes active
  useEffect(() => {
    if (mode === "DISASTER_ACTIVE") {
      const t = window.setTimeout(() => setView("sos"), 2000);
      return () => window.clearTimeout(t);
    }
  }, [mode]);

  // Ensure we have a match if WARNING is set (so Phase 1 content is ready)
  useEffect(() => {
    if (mode === "WARNING" && !matchResult) {
      runMatch(1);
    }
  }, [mode, matchResult, runMatch]);

  const reset = useCallback(() => {
    setModeState("NORMAL");
    setPhase(1);
    setCountdown(INITIAL_COUNTDOWN);
    setMatchResult(null);
    setNotifications([]);
    setEvacuationChoiceState(null);
    setView("map");
    setSmsSent(false);
    setCheckedIn(false);
    setTransportConfirmed(false);
    setTransportAvailable(true);
    setLandingDismissed(true);
  }, []);

  const value = useMemo<DemoContextType>(
    () => ({
      mode,
      setMode,
      phase,
      setPhase,
      countdown,
      matchResult,
      notifications,
      evacuationChoice,
      setEvacuationChoice,
      runMatch,
      view,
      setView,
      reset,
      smsSent,
      sendSos,
      transportAvailable,
      setTransportAvailable,
      checkedIn,
      setCheckedIn,
      transportConfirmed,
      setTransportConfirmed,
      appendNotification,
      landingDismissed,
      dismissLanding,
    }),
    [
      mode, setMode, phase, countdown, matchResult, notifications,
      evacuationChoice, setEvacuationChoice, runMatch, view, reset,
      smsSent, sendSos, transportAvailable, checkedIn, transportConfirmed,
      appendNotification, landingDismissed, dismissLanding,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextType {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

export function formatCountdown(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
