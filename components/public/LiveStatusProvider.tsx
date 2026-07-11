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

// Poll every 5 minutes. Combined with the 5-minute server-side unstable_cache
// on getCachedLiveYoutubeBroadcast, YouTube search.list is called at most
// ~288 times/day total across all visitors — down from ~6,000 units/hour
// per visitor at the old 60s cadence.
const POLL_INTERVAL_MS = 5 * 60 * 1000;
// If polling has been failing for longer than this and we're stuck showing
// Live, force it back to Not Live to prevent a permanent stale-live indicator.
const STALE_LIVE_TIMEOUT_MS = 15 * 60 * 1000;

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
  // Read the current live state inside fetchStatus without adding it to the
  // effect's dependency array (which would restart the interval on every
  // transition and double-mount in React StrictMode dev).
  const isLiveRef = useRef<boolean>(initialIsLive);
  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  // Sync state with initialIsLive if it changes server-side
  useEffect(() => {
    setIsLive(initialIsLive);
  }, [initialIsLive]);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchStatus = async () => {
      // Skip when the tab isn't visible — a hidden tab has no reason to
      // poll (the user isn't looking) and it saves both YouTube quota and
      // Vercel function invocations.
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
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
          if (isLiveRef.current !== nextLive) {
            console.log(`[LiveStatus] Live status transitioned: ${isLiveRef.current} -> ${nextLive}`);
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

          // Stale-live safety net: if we've been failing longer than the
          // timeout and state was Live, force it to Not Live so the badge
          // doesn't stick forever.
          const timeSinceLastSuccess = Date.now() - lastSuccessRef.current;
          if (timeSinceLastSuccess > STALE_LIVE_TIMEOUT_MS && isLiveRef.current) {
            console.warn(
              "[LiveStatus] Fallback activated: forcing live state to false due to prolonged polling failures."
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

    // Run first check immediately on mount, then every POLL_INTERVAL_MS.
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);

    // When the tab regains focus after being hidden a while, poll once so
    // the badge is fresh — otherwise a user coming back could wait up to
    // 5 minutes to see the actual state.
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const age = Date.now() - lastSuccessRef.current;
        if (age > POLL_INTERVAL_MS) fetchStatus();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
    // Empty deps: the effect runs once per mount. Reading isLive via a ref
    // (see isLiveRef above) avoids the constant restart the previous
    // [isLive] dependency caused, which was double-charging YouTube quota
    // during transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LiveStatusContext.Provider value={{ isLive, isLoading }}>
      {children}
    </LiveStatusContext.Provider>
  );
}
