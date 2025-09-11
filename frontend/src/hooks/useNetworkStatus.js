"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook for network status detection and handling
 * Provides offline detection, connection restoration, and query client integration
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true); // Default to online during SSR
  const [wasOffline, setWasOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
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
    if (typeof window === "undefined") return; // Skip during SSR

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
    if (typeof navigator === "undefined") {
      return true; // Assume online during SSR
    }

    if (!navigator.onLine) {
      setIsOnline(false);
      return false;
    }

    setIsChecking(true);
    try {
      // Try to fetch a small resource with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("https://www.google.com/favicon.ico", {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-cache",
        mode: "no-cors",
      });

      clearTimeout(timeoutId);
      const online = true; // If we reach here, we're online
      setIsOnline(online);
      return online;
    } catch (error) {
      console.warn("Network connectivity check failed:", error);
      setIsOnline(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Perform initial connectivity check
  useEffect(() => {
    if (typeof window !== "undefined") {
      checkNetworkConnectivity();
    }
  }, [checkNetworkConnectivity]);

  return {
    isOnline,
    wasOffline,
    isChecking,
    checkNetworkConnectivity,
  };
}
