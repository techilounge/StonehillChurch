"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";

interface LiveStatusContextType {
  isLive: boolean;
  isLoading: boolean;
}

const LiveStatusContext = createContext<LiveStatusContextType>({
  isLive: false,
  isLoading: false,
});

export const useLiveStatus = () => useContext(LiveStatusContext);

export function LiveStatusProvider({
  children,
  initialIsLive = false,
}: {
  children: React.ReactNode;
  initialIsLive?: boolean;
}) {
  const [isLive, setIsLive] = useState(initialIsLive);
  const [isLoading, setIsLoading] = useState(false);
  const lastSuccessRef = useRef<number>(Date.now());
  const consecutiveFailuresRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Sync state with initialIsLive if it changes server-side
  useEffect(() => {
    setIsLive(initialIsLive);
  }, [initialIsLive]);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchStatus = async () => {
      try {
        if (isMountedRef.current) {
          setIsLoading(true);
        }
        
        const res = await fetch(`/api/live-status?t=${Date.now()}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch status: ${res.status}`);
        }
        const data = await res.json();
        
        if (isMountedRef.current) {
          const nextLive = !!data.isLive;
          if (isLive !== nextLive) {
            console.log(`[LiveStatus] Live status transitioned: ${isLive} -> ${nextLive}`);
            setIsLive(nextLive);
          }
          lastSuccessRef.current = Date.now();
          consecutiveFailuresRef.current = 0;
        }
      } catch (error) {
        if (isMountedRef.current) {
          consecutiveFailuresRef.current += 1;
          console.error(
            `[LiveStatus] Polling failed (consecutive failures: ${consecutiveFailuresRef.current}):`,
            error
          );
          
          // Fallback logic: If we have been failing for more than 150 seconds (2.5 minutes)
          // and the state was Live, force it to Not Live to prevent sticking in Live mode.
          const timeSinceLastSuccess = Date.now() - lastSuccessRef.current;
          if (timeSinceLastSuccess > 150 * 1000 && isLive) {
            console.warn(
              "[LiveStatus] Fallback activated: Forcing live state to false due to prolonged polling failures."
            );
            setIsLive(false);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Run first check immediately on mount
    fetchStatus();

    // Poll every 20 seconds
    const interval = setInterval(fetchStatus, 20 * 1000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [isLive]);

  return (
    <LiveStatusContext.Provider value={{ isLive, isLoading }}>
      {children}
    </LiveStatusContext.Provider>
  );
}
