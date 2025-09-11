"use client";

// Optimized imports - only import what we need from TanStack Query
import {
  QueryClient,
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

// Lazy load dev tools only in development
let ReactQueryDevtools = null;
if (process.env.NODE_ENV === "development") {
  // Dynamic import for dev tools to exclude from production bundle
  import("@tanstack/react-query-devtools").then((module) => {
    ReactQueryDevtools = module.ReactQueryDevtools;
  });
}

// Import centralized query key management
import { queryKeyFactory } from "./queryKeys.js";
import { createQueryUtils } from "./queryKeyUtils.js";

// Performance monitoring removed

// Error handler for mutations
const handleMutationError = (error, variables, context, mutation) => {
  console.error("Mutation error:", error);
  // Performance monitoring removed
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

// Create optimized query client with intelligent defaults
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

        // Global error handler for mutations (lazy loaded)
        onError: handleMutationError,
      },
    },
  });
};

// Optimized cache strategies based on usage patterns and performance analysis
export const cacheStrategies = {
  // NFT metadata - very long-term cache (rarely changes, expensive to fetch)
  nftMetadata: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  // Marketplace listings - optimized for frequent updates with background refresh
  marketplaceListings: {
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced for fresher data)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
  },

  // Auction data - very short cache with aggressive refresh for real-time updates
  auctionData: {
    staleTime: 15 * 1000, // 15 seconds (reduced for more real-time feel)
    gcTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000, // Background refresh every 30 seconds
  },

  // User balances - critical real-time data with minimal cache
  userBalances: {
    staleTime: 5 * 1000, // 5 seconds (reduced for real-time accuracy)
    gcTime: 15 * 1000, // 15 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 10 * 1000, // Background refresh every 10 seconds
  },

  // Static data - maximum cache for contract addresses, ABIs, etc.
  staticData: {
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  // User-specific data - medium cache with smart invalidation
  userData: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Search results - short cache for dynamic content
  searchResults: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
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

// Create optimized query client with performance monitoring and optimization
export const createOptimizedQueryClient = async () => {
  const queryClient = createQueryClient();
  const queryUtils = createQueryUtils(queryClient);

  // Lazy load optimization modules
  const [{ createSmartInvalidationManager }] = await Promise.all([
    import("./queryInvalidationOptimizer.js"),
  ]);

  // Create optimization managers
  const invalidationManager = createSmartInvalidationManager(queryClient);

  // Attach all utilities to query client
  queryClient.utils = queryUtils;
  queryClient.invalidationManager = invalidationManager;
  // Performance optimizer removed

  return queryClient;
};

// Re-export optimized hooks
export {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  QueryClientProvider,
};

// Lazy export for dev tools
export const getReactQueryDevtools = () => ReactQueryDevtools;
