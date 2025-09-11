"use client";

import { cacheStrategies } from "./queryClient";

/**
 * Predefined query configurations for different data types
 * These configurations can be spread into useQuery options
 */

/**
 * Configuration for NFT metadata queries
 * NFT metadata rarely changes, so we can cache it for a long time
 */
export const nftMetadataConfig = {
  ...cacheStrategies.nftMetadata,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Configuration for marketplace listing queries
 * Marketplace data changes moderately, needs regular updates
 */
export const marketplaceConfig = {
  ...cacheStrategies.marketplaceListings,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: 2,
  retryDelay: 1000,
};

/**
 * Configuration for auction data queries
 * Auction data changes frequently, needs short cache times
 */
export const auctionConfig = {
  ...cacheStrategies.auctionData,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 30000, // Refetch every 30 seconds
  retry: 2,
  retryDelay: 500,
};

/**
 * Configuration for user balance queries
 * User balances are critical and change frequently
 */
export const userBalanceConfig = {
  ...cacheStrategies.userBalances,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 15000, // Refetch every 15 seconds
  retry: 3,
  retryDelay: 1000,
};

/**
 * Configuration for static data queries
 * Static data like contract addresses, rarely changes
 */
export const staticDataConfig = {
  ...cacheStrategies.staticData,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
  retryDelay: 5000,
};

/**
 * Configuration for real-time data that needs frequent updates
 * Used for auction countdowns, live bidding, etc.
 */
export const realTimeConfig = {
  staleTime: 5000, // 5 seconds
  gcTime: 30000, // 30 seconds
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 5000, // Refetch every 5 seconds
  retry: 1,
  retryDelay: 1000,
};

/**
 * Configuration for infinite queries (pagination)
 * Used for marketplace listings, search results, etc.
 */
export const infiniteQueryConfig = {
  ...cacheStrategies.marketplaceListings,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 2,
  retryDelay: 1000,
  getNextPageParam: (lastPage, pages) => {
    // Return undefined if no more pages
    if (!lastPage?.hasNextPage) return undefined;
    return pages.length; // Use page count as next page param
  },
  getPreviousPageParam: (firstPage, pages) => {
    // Return undefined if on first page
    if (pages.length <= 1) return undefined;
    return pages.length - 2; // Previous page index
  },
};

/**
 * Configuration for mutation queries
 * Used for transactions, form submissions, etc.
 */
export const mutationConfig = {
  retry: (failureCount, error) => {
    // Don't retry user rejections
    if (error?.code === "USER_REJECTED_REQUEST" || error?.code === 4001) {
      return false;
    }

    // Don't retry more than once for mutations
    return failureCount < 1;
  },
  retryDelay: 2000,
  networkMode: "always",
};

/**
 * Get query configuration based on data type
 * @param {string} dataType - Type of data being queried
 * @returns {Object} - Query configuration object
 */
export const getQueryConfig = (dataType) => {
  const configs = {
    nftMetadata: nftMetadataConfig,
    marketplace: marketplaceConfig,
    auction: auctionConfig,
    userBalance: userBalanceConfig,
    staticData: staticDataConfig,
    realTime: realTimeConfig,
    infinite: infiniteQueryConfig,
  };

  return configs[dataType] || marketplaceConfig; // Default to marketplace config
};
