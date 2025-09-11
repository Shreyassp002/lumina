/**
 * Query Key Utilities for Cache Management and Invalidation
 *
 * This module provides utilities for managing query cache invalidation,
 * prefetching, and cache manipulation across the application.
 */

import { queryKeyFactory } from "./queryKeys.js";

/**
 * Cache invalidation utilities
 * Provides methods to invalidate related queries when data changes
 */
export class QueryInvalidationManager {
  constructor(queryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Invalidate all NFT-related queries for a specific token
   */
  async invalidateNFT(tokenId) {
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.nfts.byId(tokenId),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.nfts.metadata(tokenId),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.nfts.tokenURI(tokenId),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.nfts.tokenData(tokenId),
      }),
    ]);
  }

  /**
   * Invalidate all user-related queries when user data changes
   */
  async invalidateUser(address) {
    if (!address) return;

    const userAddress = address.toLowerCase();
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.user.profile(userAddress),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.user.balance(userAddress),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.user.stats(userAddress),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.user.nfts(userAddress),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.user.createdNFTs(userAddress),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.nfts.byOwner(userAddress),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.nfts.byCreator(userAddress),
      }),
    ]);
  }

  /**
   * Invalidate marketplace queries when listings change
   */
  async invalidateMarketplace() {
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.marketplace.all(),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.marketplace.stats(),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.platform.stats(),
      }),
    ]);
  }

  /**
   * Invalidate specific user's marketplace listings
   */
  async invalidateUserListings(address) {
    if (!address) return;

    const userAddress = address.toLowerCase();
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.marketplace.userListings(userAddress),
      }),
      this.invalidateMarketplace(), // Also invalidate general marketplace data
    ]);
  }

  /**
   * Invalidate auction queries when auction data changes
   */
  async invalidateAuctions() {
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.all(),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.active(),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.stats(),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.platform.stats(),
      }),
    ]);
  }

  /**
   * Invalidate specific auction and related data
   */
  async invalidateAuction(auctionId) {
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.byId(auctionId),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.bids(auctionId),
      }),
      this.invalidateAuctions(), // Also invalidate general auction data
    ]);
  }

  /**
   * Invalidate user's auction-related queries
   */
  async invalidateUserAuctions(address) {
    if (!address) return;

    const userAddress = address.toLowerCase();
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.userAuctions(userAddress),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.auctions.userBids(userAddress),
      }),
      this.invalidateAuctions(), // Also invalidate general auction data
    ]);
  }

  /**
   * Invalidate all platform statistics
   */
  async invalidatePlatformStats() {
    await this.queryClient.invalidateQueries({
      queryKey: queryKeyFactory.platform.stats(),
    });
  }

  /**
   * Comprehensive invalidation for transaction completion
   * Called when any blockchain transaction is confirmed
   */
  async invalidateOnTransaction(transactionType, data = {}) {
    const { userAddress, tokenId, auctionId, listingId } = data;

    switch (transactionType) {
      case "NFT_MINT":
        await Promise.all([
          this.invalidateUser(userAddress),
          this.invalidatePlatformStats(),
          tokenId && this.invalidateNFT(tokenId),
        ]);
        break;

      case "NFT_TRANSFER":
        await Promise.all([
          this.invalidateUser(data.fromAddress),
          this.invalidateUser(data.toAddress),
          tokenId && this.invalidateNFT(tokenId),
        ]);
        break;

      case "MARKETPLACE_LIST":
        await Promise.all([
          this.invalidateUserListings(userAddress),
          this.invalidateUser(userAddress),
          tokenId && this.invalidateNFT(tokenId),
        ]);
        break;

      case "MARKETPLACE_BUY":
        await Promise.all([
          this.invalidateUser(data.buyerAddress),
          this.invalidateUser(data.sellerAddress),
          this.invalidateMarketplace(),
          tokenId && this.invalidateNFT(tokenId),
        ]);
        break;

      case "MARKETPLACE_CANCEL":
        await Promise.all([
          this.invalidateUserListings(userAddress),
          this.invalidateUser(userAddress),
          tokenId && this.invalidateNFT(tokenId),
        ]);
        break;

      case "AUCTION_CREATE":
        await Promise.all([
          this.invalidateUserAuctions(userAddress),
          this.invalidateUser(userAddress),
          tokenId && this.invalidateNFT(tokenId),
        ]);
        break;

      case "AUCTION_BID":
        await Promise.all([
          this.invalidateUser(userAddress),
          auctionId && this.invalidateAuction(auctionId),
        ]);
        break;

      case "AUCTION_SETTLE":
        await Promise.all([
          this.invalidateUser(data.winnerAddress),
          this.invalidateUser(data.sellerAddress),
          auctionId && this.invalidateAuction(auctionId),
          tokenId && this.invalidateNFT(tokenId),
        ]);
        break;

      default:
        // Generic invalidation for unknown transaction types
        await Promise.all([
          this.invalidateUser(userAddress),
          this.invalidatePlatformStats(),
        ]);
    }
  }
}

/**
 * Cache prefetching utilities
 * Helps improve performance by preloading likely-needed data
 */
export class QueryPrefetchManager {
  constructor(queryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Prefetch NFT metadata when NFT data is loaded
   */
  async prefetchNFTMetadata(tokenId) {
    // Only prefetch if not already cached
    const existingData = this.queryClient.getQueryData(
      queryKeyFactory.nfts.metadata(tokenId)
    );
    if (!existingData) {
      // This would be implemented with actual fetching logic
      // For now, we just mark it for prefetching
      console.log(`Prefetching NFT metadata for token ${tokenId}`);
    }
  }

  /**
   * Prefetch user's related data when user profile is accessed
   */
  async prefetchUserData(address) {
    if (!address) return;

    const userAddress = address.toLowerCase();

    // Prefetch commonly accessed user data
    await Promise.all([
      this.queryClient.prefetchQuery({
        queryKey: queryKeyFactory.user.nfts(userAddress),
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
      this.queryClient.prefetchQuery({
        queryKey: queryKeyFactory.marketplace.userListings(userAddress),
        staleTime: 2 * 60 * 1000, // 2 minutes
      }),
      this.queryClient.prefetchQuery({
        queryKey: queryKeyFactory.auctions.userAuctions(userAddress),
        staleTime: 1 * 60 * 1000, // 1 minute
      }),
    ]);
  }

  /**
   * Prefetch marketplace data for better pagination experience
   */
  async prefetchNextPage(currentOffset, limit, filters = {}) {
    const nextOffset = currentOffset + limit;

    await this.queryClient.prefetchQuery({
      queryKey: queryKeyFactory.marketplace.listings(
        nextOffset,
        limit,
        filters
      ),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }
}

/**
 * Cache management utilities
 * Provides methods for cache cleanup and optimization
 */
export class QueryCacheManager {
  constructor(queryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Remove stale NFT metadata from cache
   * Useful for cleaning up metadata that hasn't been accessed recently
   */
  removeStaleNFTMetadata(olderThanMs = 24 * 60 * 60 * 1000) {
    // 24 hours
    const now = Date.now();

    this.queryClient
      .getQueryCache()
      .getAll()
      .forEach((query) => {
        const queryKey = query.queryKey;

        // Check if this is an NFT metadata query
        if (queryKey[0] === "nfts" && queryKey[1] === "metadata") {
          const lastUpdated = query.state.dataUpdatedAt;

          if (now - lastUpdated > olderThanMs) {
            this.queryClient.removeQueries({ queryKey });
          }
        }
      });
  }

  /**
   * Clear all user-specific cache data
   * Useful when user disconnects wallet
   */
  clearUserCache(address) {
    if (!address) return;

    const userAddress = address.toLowerCase();

    // Remove all user-related queries
    this.queryClient.removeQueries({ queryKey: queryKeyFactory.user.all() });
    this.queryClient.removeQueries({
      queryKey: queryKeyFactory.nfts.all(),
      predicate: (query) => {
        const key = query.queryKey;
        return (
          (key.includes("owner") && key.includes(userAddress)) ||
          (key.includes("creator") && key.includes(userAddress))
        );
      },
    });
    this.queryClient.removeQueries({
      queryKey: queryKeyFactory.marketplace.all(),
      predicate: (query) => {
        const key = query.queryKey;
        return key.includes("userListings") && key.includes(userAddress);
      },
    });
    this.queryClient.removeQueries({
      queryKey: queryKeyFactory.auctions.all(),
      predicate: (query) => {
        const key = query.queryKey;
        return (
          (key.includes("userAuctions") || key.includes("userBids")) &&
          key.includes(userAddress)
        );
      },
    });
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();

    const stats = {
      totalQueries: queries.length,
      byType: {},
      staleCounts: 0,
      errorCounts: 0,
    };

    queries.forEach((query) => {
      const type = query.queryKey[0];
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      if (query.isStale()) {
        stats.staleCounts++;
      }

      if (query.state.error) {
        stats.errorCounts++;
      }
    });

    return stats;
  }
}

/**
 * Utility functions for query key manipulation
 */
export const queryKeyUtils = {
  /**
   * Check if two query keys match (useful for cache operations)
   */
  keysMatch: (key1, key2) => {
    if (key1.length !== key2.length) return false;
    return key1.every((part, index) => part === key2[index]);
  },

  /**
   * Extract address from query key (if present)
   */
  extractAddress: (queryKey) => {
    const addressIndex = queryKey.findIndex(
      (part) =>
        typeof part === "string" && part.startsWith("0x") && part.length === 42
    );
    return addressIndex !== -1 ? queryKey[addressIndex] : null;
  },

  /**
   * Extract token ID from query key (if present)
   */
  extractTokenId: (queryKey) => {
    // Look for numeric token IDs
    const tokenId = queryKey.find(
      (part) => typeof part === "string" && /^\d+$/.test(part)
    );
    return tokenId ? parseInt(tokenId, 10) : null;
  },

  /**
   * Create a query key matcher function
   */
  createMatcher: (pattern) => {
    return (queryKey) => {
      if (pattern.length > queryKey.length) return false;
      return pattern.every((part, index) => {
        if (part === "*") return true; // Wildcard
        return part === queryKey[index];
      });
    };
  },
};

/**
 * Factory function to create all cache management utilities
 */
export const createQueryUtils = (queryClient) => {
  return {
    invalidation: new QueryInvalidationManager(queryClient),
    prefetch: new QueryPrefetchManager(queryClient),
    cache: new QueryCacheManager(queryClient),
    utils: queryKeyUtils,
  };
};
