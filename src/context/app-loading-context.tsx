    import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from "react";

// Loading priority levels
export enum LoadingPriority {
  LOW = "low", // Non-critical operations (filtering, sorting)
  MEDIUM = "medium", // Important operations (fetching secondary data)
  HIGH = "high", // Critical operations (authentication, workspace loading)
}

// Loading state interface with priority and timestamps
interface LoadingState {
  id: string;
  isLoading: boolean;
  priority: LoadingPriority;
  startTime: number | null;
}

interface LoadingContextType {
  registerLoadingState: (
    id: string,
    isLoading: boolean,
    priority?: LoadingPriority
  ) => void;
  unregisterLoadingState: (id: string) => void;
  isAnyLoading: boolean;
  isCriticalLoading: boolean;
  loadingStates: Record<string, LoadingState>;
  criticalLoadingMessage: string | null;
}

const AppLoadingContext = createContext<LoadingContextType | undefined>(
  undefined
);

interface AppLoadingProviderProps {
  children: ReactNode;
  // Configuration options
  debounceTime?: number; // Time to wait before showing loading UI (ms)
  minDisplayTime?: number; // Minimum time to show loading UI (ms)
}

export function AppLoadingProvider({
  children,
  debounceTime = 300, // Default: wait 300ms before showing loading UI
  minDisplayTime = 500, // Default: show loading UI for at least 500ms
}: AppLoadingProviderProps) {
  // Store loading states with priority and timestamps
  const [loadingStates, setLoadingStates] = useState<
    Record<string, LoadingState>
  >({});

  // UI loading state flags
  const [isAnyLoading, setIsAnyLoading] = useState(false);
  const [isCriticalLoading, setIsCriticalLoading] = useState(false);
  const [criticalLoadingMessage, setCriticalLoadingMessage] = useState<
    string | null
  >(null);

  // Debounce and minimum display timers
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const loadingEndTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Track when the loading began to ensure minimum display time
  const loadingStartTime = useRef<number | null>(null);

  // Calculate current loading state with improved debouncing and min display time
  const calculateLoadingState = useCallback(() => {
    const now = Date.now();
    const loadingItems = Object.values(loadingStates).filter(
      (state) => state.isLoading
    );

    // Check if any critical (HIGH priority) items are loading
    const hasCriticalLoading = loadingItems.some(
      (state) => state.priority === LoadingPriority.HIGH
    );

    // Determine if we should show loading based on timestamps and priorities
    const shouldShowLoading = loadingItems.length > 0;

    console.log(
      `Loading state calculation: shouldShow=${shouldShowLoading}, currentlyShowing=${isAnyLoading}, items=${loadingItems.length}`
    );

    // Enhanced state transitions with smoothing to prevent flicker
    if (shouldShowLoading) {
      // If loading is starting or continuing
      if (!isAnyLoading) {
        // Starting a new loading session
        console.log("Starting new loading session");
        loadingStartTime.current = now;
        setIsAnyLoading(true);
        setCriticalLoadingMessage(getCriticalLoadingMessage());
      } else {
        // Continue showing loading and just update the message if needed
        setCriticalLoadingMessage(getCriticalLoadingMessage());
      }

      // Always update critical loading state
      setIsCriticalLoading(hasCriticalLoading);
    } else if (!shouldShowLoading && isAnyLoading) {
      // If loading is ending, respect minimum display time
      const elapsedTime = loadingStartTime.current
        ? now - loadingStartTime.current
        : minDisplayTime;

      // Ensure minimum display time for better UX
      if (elapsedTime >= minDisplayTime) {
        console.log("Ending loading session (min time elapsed)");
        setIsAnyLoading(false);
        setIsCriticalLoading(false);
        setCriticalLoadingMessage(null);
        loadingStartTime.current = null;
      } else {
        // Keep showing for the remaining time to meet minDisplayTime
        const remainingTime = minDisplayTime - elapsedTime;
        console.log(
          `Delaying end of loading for ${remainingTime}ms to meet minimum display time`
        );

        const timer = setTimeout(() => {
          // Double-check that we still don't have loading items before hiding
          const currentLoadingItems = Object.values(loadingStates).filter(
            (state) => state.isLoading
          );

          if (currentLoadingItems.length === 0) {
            console.log("Ending loading session after minimum display time");
            setIsAnyLoading(false);
            setIsCriticalLoading(false);
            setCriticalLoadingMessage(null);
            loadingStartTime.current = null;
          } else {
            console.log("Can't end loading - new items are loading");
          }
        }, remainingTime);

        return () => clearTimeout(timer);
      }
    }
  }, [loadingStates, isAnyLoading, minDisplayTime]);

  // Get the most relevant loading message to display
  const getCriticalLoadingMessage = useCallback(() => {
    const highPriorityState = Object.values(loadingStates)
      .filter(
        (state) => state.isLoading && state.priority === LoadingPriority.HIGH
      )
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))[0];

    if (highPriorityState) {
      return `Loading ${highPriorityState.id
        .replace(/-/g, " ")
        .replace(/_/g, " ")}...`;
    }

    return "Loading...";
  }, [loadingStates]);

  // Update the loading state whenever any of the registered states change
  useEffect(() => {
    const cleanup = calculateLoadingState();

    console.log(
      "Loading states:",
      Object.fromEntries(
        Object.entries(loadingStates).map(([id, state]) => [
          id,
          state.isLoading,
        ])
      ),
      "IsAnyLoading:",
      isAnyLoading,
      "IsCriticalLoading:",
      isCriticalLoading
    );

    return cleanup;
  }, [loadingStates, calculateLoadingState, isAnyLoading, isCriticalLoading]);

  // Register a loading state with debounce
  const registerLoadingState = useCallback(
    (
      id: string,
      isLoading: boolean,
      priority: LoadingPriority = LoadingPriority.MEDIUM
    ) => {
      // Clear any existing debounce timer for this ID
      if (debounceTimers.current[id]) {
        clearTimeout(debounceTimers.current[id]);
        delete debounceTimers.current[id];
      }

      // Clear any existing end timer for this ID
      if (loadingEndTimers.current[id]) {
        clearTimeout(loadingEndTimers.current[id]);
        delete loadingEndTimers.current[id];
      }

      if (isLoading) {
        // If loading is starting, debounce it
        debounceTimers.current[id] = setTimeout(() => {
          setLoadingStates((prev) => ({
            ...prev,
            [id]: {
              id,
              isLoading: true,
              priority,
              startTime: Date.now(),
            },
          }));
          delete debounceTimers.current[id];
          console.log(`Loading state activated: ${id} (${priority})`);
        }, debounceTime);
      } else {
        // If loading is ending, apply it immediately to avoid delays in UI response
        setLoadingStates((prev) => {
          const newStates = { ...prev };

          // Only update if the loading state exists and is currently loading
          if (newStates[id] && newStates[id].isLoading) {
            newStates[id] = {
              ...newStates[id],
              isLoading: false,
              startTime: null,
            };
            console.log(`Loading state deactivated: ${id}`);
          }
          return newStates;
        });
      }
    },
    [debounceTime]
  );

  // Unregister a loading state
  const unregisterLoadingState = useCallback((id: string) => {
    // Clear any existing timers
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }

    if (loadingEndTimers.current[id]) {
      clearTimeout(loadingEndTimers.current[id]);
      delete loadingEndTimers.current[id];
    }

    setLoadingStates((prev) => {
      const newStates = { ...prev };
      if (id in newStates) {
        delete newStates[id];
        console.log(`Unregistered loading state: ${id}`);
      }
      return newStates;
    });
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      // Clear all debounce timers
      Object.values(debounceTimers.current).forEach((timer) =>
        clearTimeout(timer)
      );
      // Clear all end timers
      Object.values(loadingEndTimers.current).forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, []);

  const value = {
    registerLoadingState,
    unregisterLoadingState,
    isAnyLoading,
    isCriticalLoading,
    loadingStates,
    criticalLoadingMessage,
  };

  return (
    <AppLoadingContext.Provider value={value}>
      {children}
    </AppLoadingContext.Provider>
  );
}

export const useAppLoading = () => {
  const context = useContext(AppLoadingContext);
  if (context === undefined) {
    throw new Error("useAppLoading must be used within an AppLoadingProvider");
  }
  return context;
};

// Custom hook to register a loading state with proper cleanup
export const useRegisterLoadingState = (
  id: string,
  isLoading: boolean,
  priority: LoadingPriority = LoadingPriority.MEDIUM
) => {
  const { registerLoadingState, unregisterLoadingState } = useAppLoading();

  useEffect(() => {
    registerLoadingState(id, isLoading, priority);

    return () => {
      // Ensure we clean up loading states when component unmounts
      unregisterLoadingState(id);
    };
  }, [id, isLoading, priority, registerLoadingState, unregisterLoadingState]);
};
