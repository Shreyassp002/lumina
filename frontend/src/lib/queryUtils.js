"use client";

import { queryKeys } from "./queryClient";

/**
 * Utility functions for query management and cache invalidation
 */

/**
 * Invalidate all NFT-related queries
 * @param {QueryClient} queryClient - The query client instance
 * @param {string} tokenId - Optional specific token ID to invalidate
 */
export const invalidateNFTQueries = (queryClient, tokenId = null) => {
  if (tokenId) {
    // Invalidate specific NFT queries
    queryClient.invalidateQueries({ queryKey: queryKeys.nfts.byId(tokenId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.nfts.metadata(tokenId),
    });
  } else {
    // Invalidate all NFT queries
    queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all });
  }
};

/**
 * Invalidate marketplace-related queries
 * @param {QueryClient} queryClient - The query client instance
 * @param {string} userAddress - Optional user address to invalidate user-specific queries
 */
export const invalidateMarketplaceQueries = (
  queryClient,
  userAddress = null
) => {
  // Invalidate all marketplace listings
  queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.all });

  if (userAddress) {
    // Invalidate user-specific marketplace queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.marketplace.userListings(userAddress),
    });
  }
};

/**
 * Invalidate auction-related queries
 * @param {QueryClient} queryClient - The query client instance
 * @param {string} auctionId - Optional specific auction ID to invalidate
 */
export const invalidateAuctionQueries = (queryClient, auctionId = null) => {
  if (auctionId) {
    // Invalidate specific auction queries
    queryClient.invalidateQueries({
      queryKey: queryKeys.auctions.byId(auctionId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.auctions.bids(auctionId),
    });
  } else {
    // Invalidate all auction queries
    queryClient.invalidateQueries({ queryKey: queryKeys.auctions.all });
  }
};

/**
 * Invalidate user-related queries
 * @param {QueryClient} queryClient - The query client instance
 * @param {string} userAddress - User address to invalidate
 */
export const invalidateUserQueries = (queryClient, userAddress) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.user.profile(userAddress),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.user.balance(userAddress),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.user.stats(userAddress),
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.user.nfts(userAddress) });
};

/**
 * Prefetch NFT data for better UX
 * @param {QueryClient} queryClient - The query client instance
 * @param {string} tokenId - Token ID to prefetch
 * @param {Function} fetchFn - Function to fetch the data
 */
export const prefetchNFTData = async (queryClient, tokenId, fetchFn) => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.nfts.byId(tokenId),
    queryFn: fetchFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Set optimistic data for immediate UI updates
 * @param {QueryClient} queryClient - The query client instance
 * @param {Array} queryKey - Query key to update
 * @param {Function} updater - Function to update the data
 */
export const setOptimisticData = (queryClient, queryKey, updater) => {
  queryClient.setQueryData(queryKey, (oldData) => {
    if (!oldData) return oldData;
    return updater(oldData);
  });
};

/**
 * Error handler for blockchain-related errors
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const handleBlockchainError = (error) => {
  // User rejected transaction
  if (error?.code === "USER_REJECTED_REQUEST" || error?.code === 4001) {
    return "Transaction was cancelled by user";
  }

  // Insufficient funds
  if (error?.message?.includes("insufficient funds")) {
    return "Insufficient funds for this transaction";
  }

  // Network errors
  if (
    error?.message?.includes("network") ||
    error?.message?.includes("fetch")
  ) {
    return "Network error. Please check your connection and try again";
  }

  // RPC errors
  if (error?.message?.includes("RPC")) {
    return "Blockchain network error. Please try again";
  }

  // IPFS errors
  if (error?.message?.includes("IPFS") || error?.message?.includes("ipfs")) {
    return "Failed to load NFT metadata. Please try again";
  }

  // Contract errors
  if (error?.message?.includes("revert")) {
    return "Transaction failed. Please check the requirements and try again";
  }

  // Generic error
  return error?.message || "An unexpected error occurred";
};

/**
 * Batch invalidate multiple query types after a transaction
 * @param {QueryClient} queryClient - The query client instance
 * @param {Object} options - Options for what to invalidate
 */
export const batchInvalidateAfterTransaction = (queryClient, options = {}) => {
  const { userAddress, tokenId, auctionId, listingId } = options;

  // Always invalidate user queries if address provided
  if (userAddress) {
    invalidateUserQueries(queryClient, userAddress);
  }

  // Invalidate NFT queries if token ID provided
  if (tokenId) {
    invalidateNFTQueries(queryClient, tokenId);
  }

  // Invalidate auction queries if auction ID provided
  if (auctionId) {
    invalidateAuctionQueries(queryClient, auctionId);
  }

  // Always invalidate marketplace queries for any transaction
  invalidateMarketplaceQueries(queryClient, userAddress);
};
