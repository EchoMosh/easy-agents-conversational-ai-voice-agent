import { useState, useEffect, useRef } from 'react';
import { LoadingPriority, useAppLoading } from '@/context/app-loading-context';

/**
 * A hook that helps manage API loading states with the global loading context
 * 
 * @param id The unique identifier for this loading state
 * @param options Configuration options
 * @returns Loading state controls
 */
export function useApiLoading(
  id: string, 
  options: {
    /**
     * Initial loading state
     * @default false
     */
    initialState?: boolean;
    
    /**
     * Loading priority level
     * @default LoadingPriority.MEDIUM
     */
    priority?: LoadingPriority;
    
    /**
     * Whether to automatically register with the global loading context
     * @default true
     */
    register?: boolean;
    
    /**
     * Debounce time in ms for loading state changes
     * @default 200 (start) / 300 (end)
     */
    debounce?: {
      start?: number;
      end?: number;
    }
  } = {}
) {
  const {
    initialState = false,
    priority = LoadingPriority.MEDIUM,
    register = true,
    debounce = { start: 200, end: 300 } // Debounce loading state changes
  } = options;
  
  const [isLoading, setIsLoading] = useState(initialState);
  
  // Use refs to track debounce timers
  const startTimerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track actual loading state before debouncing
  const actualLoadingStateRef = useRef(initialState);
  
  // Track stable loading state to avoid rapid transitions
  const [stableLoadingState, setStableLoadingState] = useState(initialState);
  
  // Cleanup function for timers
  useEffect(() => {
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);
  
  // Create a safe version of useAppLoading that won't throw if register is false
  // We still need to call the hook unconditionally to follow React's rules
  const appLoadingContext = useSafeAppLoading(register);
  
  // Helper function to safely use the app loading context
  function useSafeAppLoading(shouldUse: boolean) {
    try {
      // Always call the hook to follow React's rules
      const context = useAppLoading();
      // But only return it if we should use it
      return shouldUse ? context : {
        registerLoadingState: () => {},
        unregisterLoadingState: () => {},
        isAnyLoading: false,
        isCriticalLoading: false,
        loadingStates: {},
        criticalLoadingMessage: null
      };
    } catch (error) {
      // If the context is not available and we're not using it anyway, return a dummy context
      if (!shouldUse) {
        return {
          registerLoadingState: () => {},
          unregisterLoadingState: () => {},
          isAnyLoading: false,
          isCriticalLoading: false,
          loadingStates: {},
          criticalLoadingMessage: null
        };
      }
      // Otherwise, rethrow the error
      throw error;
    }
  }
  
  // Update our stable loading state with debouncing to prevent flickering
  useEffect(() => {
    // Register with the global loading context if enabled
    if (register) {
      appLoadingContext.registerLoadingState(id, stableLoadingState, priority);
      
      // Clean up on unmount or when dependencies change
      return () => {
        appLoadingContext.unregisterLoadingState(id);
      };
    }
  }, [id, register, stableLoadingState, priority, appLoadingContext]);
  
  /**
   * Start the loading state with debouncing
   */
  const startLoading = () => {
    // Update the actual state immediately
    actualLoadingStateRef.current = true;
    
    // Clear any pending end timer
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    
    // If we already have a start timer, don't create another one
    if (!startTimerRef.current && !stableLoadingState) {
      startTimerRef.current = setTimeout(() => {
        setStableLoadingState(true);
        setIsLoading(true);
        startTimerRef.current = null;
      }, debounce.start);
    } else {
      // Already loading or timer in progress
      setIsLoading(true);
    }
  };
  
  /**
   * End the loading state with debouncing to prevent flicker
   */
  const endLoading = () => {
    // Update the actual state immediately
    actualLoadingStateRef.current = false;
    
    // Clear any pending start timer
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    
    // Only set a timer if we're currently in loading state and don't have an end timer yet
    if (!endTimerRef.current && stableLoadingState) {
      endTimerRef.current = setTimeout(() => {
        // Only end loading if we're still not loading
        if (!actualLoadingStateRef.current) {
          setStableLoadingState(false);
          setIsLoading(false);
        }
        endTimerRef.current = null;
      }, debounce.end);
    } else {
      // Not loading or timer already in progress
      setIsLoading(false);
    }
  };
  
  /**
   * Utility to wrap an async function with loading state
   */
  const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      startLoading();
      return await fn();
    } finally {
      endLoading();
    }
  };
  
  return {
    isLoading,
    setIsLoading,
    startLoading,
    endLoading,
    withLoading
  };
}

/**
 * A hook that handles loading state for data fetching operations
 */
export function useFetchLoading<T>(
  id: string,
  fetchFn: () => Promise<T>,
  options: {
    /**
     * Whether to fetch immediately when the component mounts
     * @default true
     */
    immediate?: boolean;
    
    /**
     * Loading priority level
     * @default LoadingPriority.MEDIUM
     */
    priority?: LoadingPriority;
    
    /**
     * Number of retry attempts for failed fetches
     * @default 0
     */
    retryCount?: number;
    
    /**
     * Dependency array that triggers refetch when changed
     * @default []
     */
    deps?: any[];
  } = {}
) {
  const {
    immediate = true,
    priority = LoadingPriority.MEDIUM,
    retryCount = 0,
    deps = []
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { isLoading, startLoading, endLoading } = useApiLoading(id, { 
    initialState: immediate,
    priority,
    // Use a longer debounce for end loading to prevent flickering
    debounce: { 
      start: 200, 
      end: 500  // Longer debounce for ending loading state
    }
  });
  
  const fetchData = async (attempt = 0) => {
    try {
      startLoading();
      setError(null);
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err: any) {
      console.error(`Error fetching ${id}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Retry logic
      if (attempt < retryCount) {
        console.log(`Retrying ${id} fetch (${attempt + 1}/${retryCount})...`);
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchData(attempt + 1);
      }
      
      return null;
    } finally {
      endLoading();
    }
  };
  
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, deps);
  
  return {
    data,
    isLoading,
    error,
    fetchData,
    setData
  };
}
