"use client";

import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useState } from "react";

/**
 * Component that shows offline status and provides manual sync option
 */
export function OfflineIndicator() {
  const { isOnline, checkNetworkConnectivity } = useNetworkStatus();
  const [isChecking, setIsChecking] = useState(false);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await checkNetworkConnectivity();
    } finally {
      setIsChecking(false);
    }
  };

  // Don't show anything when online
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60]">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <WifiOff size={16} />
        <span className="text-sm font-medium">You're offline</span>
        <span className="text-xs text-yellow-600">Showing cached data</span>
        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          className="ml-2 p-1 hover:bg-yellow-200 rounded transition-colors disabled:opacity-50"
          title="Check connection"
        >
          <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}

/**
 * Smaller inline offline indicator for components
 */
export function InlineOfflineIndicator({ className = "" }) {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-1 text-yellow-600 text-xs ${className}`}
    >
      <WifiOff size={12} />
      <span>Offline</span>
    </div>
  );
}

/**
 * Connection status indicator that shows both online and offline states
 */
export function ConnectionStatus({ showWhenOnline = false }) {
  const { isOnline } = useNetworkStatus();

  if (!showWhenOnline && isOnline) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-1 text-xs ${
        isOnline ? "text-green-600" : "text-yellow-600"
      }`}
    >
      {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
      <span>{isOnline ? "Online" : "Offline"}</span>
    </div>
  );
}
