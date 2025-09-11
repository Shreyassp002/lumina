"use client";

import { QueryClient } from "@tanstack/react-query";
// Import centralized query key management
import { queryKeyFactory } from "./queryKeys.js";
import { createQueryUtils } from "./queryKeyUtils.js";
// Performance monitor removed

// Error handler for mutations
const handleMutationError = (error, variables, context, mutation) => {
  console.error("Mutation error:", error);
  // Performance monitoring removed
  // You can add toast notifications or other error handling here
};

// Retry function with exponential backoff
const retryFunction = (failureCount, error) => {
  // Don't retry on certain error types
  if (error?.code === "USER_REJECTED_REQUEST" || error?.code === 4001) {
    return false;
  }

  // Don't retry more than 3 times
  if (failureCount >= 3) {
    return false;
  }

  // Retry network errors and RPC errors
  return true;
};

// Create query client with intelligent defaults
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000, // 5 minutes

        // Keep data in cache for 10 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

        // Don't refetch on window focus for better UX
        refetchOnWindowFocus: false,

        // Refetch on reconnect to get fresh data
        refetchOnReconnect: true,

        // Retry failed requests with exponential backoff
        retry: retryFunction,

        // Delay between retries (exponential backoff)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Enable background refetching for better UX
        refetchOnMount: true,

        // Network mode - always try to fetch
        networkMode: "always",
      },
      mutations: {
        // Retry mutations once on network errors
        retry: (failureCount, error) => {
          // Don't retry user rejections
          if (error?.code === "USER_REJECTED_REQUEST" || error?.code === 4001) {
            return false;
          }

          // Only retry once for mutations
          return failureCount < 1;
        },

        // Global error handler for mutations
        onError: handleMutationError,
      },
    },
  });
};

// Different cache strategies for different data types
export const cacheStrategies = {
  // NFT metadata - long-term cache (rarely changes)
  nftMetadata: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Marketplace listings - medium-term cache
  marketplaceListings: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },

  // Auction data - short-term cache (frequent changes)
  auctionData: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },

  // User balances - very short cache (real-time critical)
  userBalances: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 30 * 1000, // 30 seconds
  },

  // Static data - very long cache
  staticData: {
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};

// Re-export query keys for backward compatibility
export const queryKeys = queryKeyFactory;

// Create query utilities factory for use with query client
export const createQueryClientWithUtils = () => {
  const queryClient = createQueryClient();
  const queryUtils = createQueryUtils(queryClient);

  // Attach utilities to query client for easy access
  queryClient.utils = queryUtils;

  return queryClient;
};
