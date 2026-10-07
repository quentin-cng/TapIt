import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useSession } from "../auth/SessionProvider";

export type HomeRewardEvent = {
  checkinId: string;
  finalTotalPoints: number;
  finalWeeklySessions: number | null;
  previousTotalPoints: number;
  previousWeeklySessions: number | null;
  userId: string;
  weeklyGoal: number | null;
  weeklyGoalCompleted: boolean;
};

type RewardEventContextValue = {
  consumeRewardEvent: (checkinId: string) => boolean;
  getPendingRewardEvent: () => HomeRewardEvent | null;
  publishRewardEvent: (event: HomeRewardEvent) => void;
};

const RewardEventContext = createContext<RewardEventContextValue | null>(null);

export function RewardEventProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const pendingEvent = useRef<HomeRewardEvent | null>(null);
  const consumedCheckinIds = useRef(new Set<string>());
  const previousUserId = useRef(session?.user.id ?? null);

  useEffect(() => {
    const userId = session?.user.id ?? null;
    if (previousUserId.current === userId) return;

    pendingEvent.current = null;
    consumedCheckinIds.current.clear();
    previousUserId.current = userId;
  }, [session?.user.id]);

  const publishRewardEvent = useCallback((event: HomeRewardEvent) => {
    if (consumedCheckinIds.current.has(event.checkinId)) return;

    pendingEvent.current = event;
  }, []);

  const getPendingRewardEvent = useCallback(
    () => pendingEvent.current,
    [],
  );

  const consumeRewardEvent = useCallback((checkinId: string) => {
    if (pendingEvent.current?.checkinId !== checkinId) return false;

    consumedCheckinIds.current.add(checkinId);
    pendingEvent.current = null;
    return true;
  }, []);

  const value = useMemo(
    () => ({
      consumeRewardEvent,
      getPendingRewardEvent,
      publishRewardEvent,
    }),
    [consumeRewardEvent, getPendingRewardEvent, publishRewardEvent],
  );

  return (
    <RewardEventContext.Provider value={value}>
      {children}
    </RewardEventContext.Provider>
  );
}

export function useRewardEvents() {
  const context = useContext(RewardEventContext);
  if (!context) {
    throw new Error("useRewardEvents must be used within RewardEventProvider");
  }

  return context;
}
