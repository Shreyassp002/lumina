"use client";
import { usePublicClient } from "wagmi";
import {
  LUMINA_MARKETPLACE_ABI,
  LUMINA_MARKETPLACE_ADDRESS,
} from "../../../abi/luminaMarketplace";
import { useState } from "react";

export default function MarketplaceDebug() {
  const publicClient = usePublicClient();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function to convert BigInt values to strings for JSON serialization
  const convertBigIntToString = (obj) => {
    if (typeof obj === "bigint") {
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return obj.map(convertBigIntToString);
    }
    if (obj && typeof obj === "object") {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = convertBigIntToString(value);
      }
      return converted;
    }
    return obj;
  };

  const checkMarketplace = async () => {
    setLoading(true);
    try {
      // Get current listing counter
      const listingCounter = await publicClient.readContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: "getCurrentListingId",
        args: [],
      });

      // Get active listings
      const activeListings = await publicClient.readContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: "getActiveListings",
        args: [0, 10],
      });

      // Get platform stats
      const totalVolume = await publicClient.readContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: "totalVolume",
        args: [],
      });

      const totalSales = await publicClient.readContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: "totalSales",
        args: [],
      });

      setDebugInfo({
        listingCounter: Number(listingCounter),
        activeListings: convertBigIntToString(activeListings),
        totalVolume: Number(totalVolume),
        totalSales: Number(totalSales),
        timestamp: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error("Debug check failed:", error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-emerald-200">
        Marketplace Debug Info
      </h3>

      <button
        onClick={checkMarketplace}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-lime-500 text-black rounded-lg hover:from-emerald-400 hover:to-lime-400 disabled:opacity-50 neon-glow"
      >
        {loading ? "Checking..." : "Check Marketplace State"}
      </button>

      {debugInfo && (
        <div className="space-y-2 text-sm">
          <div>
            <strong className="text-emerald-300">Timestamp:</strong>{" "}
            {debugInfo.timestamp}
          </div>
          <div>
            <strong className="text-emerald-300">Listing Counter:</strong>{" "}
            {debugInfo.listingCounter}
          </div>
          <div>
            <strong className="text-emerald-300">Total Volume:</strong>{" "}
            {debugInfo.totalVolume} ETH
          </div>
          <div>
            <strong className="text-emerald-300">Total Sales:</strong>{" "}
            {debugInfo.totalSales}
          </div>

          {debugInfo.activeListings && (
            <div>
              <strong className="text-emerald-300">Active Listings:</strong>
              <pre className="mt-2 p-2 bg-[#0e1518] rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo.activeListings, null, 2)}
              </pre>
            </div>
          )}

          {debugInfo.error && (
            <div className="text-red-400">
              <strong className="text-red-400">Error:</strong> {debugInfo.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
