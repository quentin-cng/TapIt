import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isValidCheckinToken } from "./checkin-contract";

const pendingCheckinStorageKey = "tapit.pending-checkin-token.v1";

type PendingCheckinContextValue = {
  acknowledgePendingToken: (token: string) => Promise<boolean>;
  isHydrating: boolean;
  pendingToken: string | null;
  persistPendingToken: (token: string) => Promise<boolean>;
};

const PendingCheckinContext = createContext<PendingCheckinContextValue | null>(
  null,
);

export function PendingCheckinProvider({ children }: PropsWithChildren) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const pendingTokenRef = useRef<string | null>(null);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());

  const enqueueStorageOperation = useCallback(
    <T,>(operation: () => Promise<T>): Promise<T> => {
      const nextOperation = storageQueue.current.then(operation, operation);
      storageQueue.current = nextOperation.then(
        () => undefined,
        () => undefined,
      );
      return nextOperation;
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    void AsyncStorage.getItem(pendingCheckinStorageKey)
      .then(async (storedToken) => {
        if (!isMounted) return;

        if (storedToken && isValidCheckinToken(storedToken)) {
          pendingTokenRef.current = storedToken;
          setPendingToken(storedToken);
        } else if (storedToken !== null) {
          await AsyncStorage.removeItem(pendingCheckinStorageKey);
        }
      })
      .catch((error) => {
        console.error("[mobile check-in] pending token restore failed", error);
      })
      .finally(() => {
        if (isMounted) setIsHydrating(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const persistPendingToken = useCallback(
    async (token: string) => {
      if (!isValidCheckinToken(token)) return false;

      pendingTokenRef.current = token;
      setPendingToken(token);

      try {
        await enqueueStorageOperation(() =>
          AsyncStorage.setItem(pendingCheckinStorageKey, token),
        );
        return true;
      } catch (error) {
        console.error("[mobile check-in] pending token save failed", error);

        if (pendingTokenRef.current === token) {
          pendingTokenRef.current = null;
          setPendingToken(null);
        }

        return false;
      }
    },
    [enqueueStorageOperation],
  );

  const acknowledgePendingToken = useCallback(
    async (token: string) => {
      if (!isValidCheckinToken(token) || pendingTokenRef.current !== token) {
        return false;
      }

      try {
        return await enqueueStorageOperation(async () => {
          const storedToken = await AsyncStorage.getItem(
            pendingCheckinStorageKey,
          );

          // A newer App Link may have replaced this token while this operation
          // waited. Never clear anything except the exact acknowledged token.
          if (pendingTokenRef.current !== token) return false;

          if (storedToken === token) {
            await AsyncStorage.removeItem(pendingCheckinStorageKey);
          }

          if (pendingTokenRef.current === token) {
            pendingTokenRef.current = null;
            setPendingToken(null);
          }

          return true;
        });
      } catch (error) {
        console.error(
          "[mobile check-in] pending token acknowledgement failed",
          error,
        );
        return false;
      }
    },
    [enqueueStorageOperation],
  );

  const value = useMemo(
    () => ({
      acknowledgePendingToken,
      isHydrating,
      pendingToken,
      persistPendingToken,
    }),
    [
      acknowledgePendingToken,
      isHydrating,
      pendingToken,
      persistPendingToken,
    ],
  );

  return (
    <PendingCheckinContext.Provider value={value}>
      {children}
    </PendingCheckinContext.Provider>
  );
}

export function usePendingCheckin() {
  const value = useContext(PendingCheckinContext);

  if (!value) {
    throw new Error(
      "usePendingCheckin must be used inside PendingCheckinProvider.",
    );
  }

  return value;
}
