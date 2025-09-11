"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook for network status detection and handling
 * Provides offline detection, connection restoration, and query client integration
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const queryClient = useQueryClient();

  // Handle online event
  const handleOnline = useCallback(() => {
    setIsOnline(true);

    // Use a state updater function to get the current wasOffline value
    setWasOffline((prevWasOffline) => {
      if (prevWasOffline) {
        // Invalidate all queries to refresh data when coming back online
        queryClient.invalidateQueries();

        // Resume paused mutations
        queryClient.resumePausedMutations();

        console.log("Connection restored - syncing data");
      }
      return false;
    });
  }, [queryClient]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    console.log("Connection lost - entering offline mode");
  }, []);

  useEffect(() => {
    // Set initial online status after hydration
    setIsOnline(navigator.onLine);

    // Set up event listeners for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Additional network check using fetch with timeout
  const checkNetworkConnectivity = useCallback(async () => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Try to fetch a small resource with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/api/health", {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn("Network connectivity check failed:", error);
      return false;
    }
  }, []);

  return {
    isOnline,
    wasOffline,
    checkNetworkConnectivity,
  };
}
