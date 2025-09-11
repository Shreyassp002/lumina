/**
 * Query Invalidation Optimizer
 *
 * This module provides intelligent query invalidation strategies to minimize
 * unnecessary re-renders while ensuring data consistency.
 */

import { queryKeyFactory } from "./queryKeys";

/**
 * Debounced invalidation manager to batch invalidations
 */
class InvalidationManager {
  constructor(queryClient) {
    this.queryClient = queryClient;
    this.pendingInvalidations = new Set();
    this.debounceTimeout = null;
    this.debounceDelay = 100; // 100ms debounce
  }

  /**
   * Add invalidation to the pending queue
   */
  scheduleInvalidation(queryKey, options = {}) {
    const keyString = Array.isArray(queryKey) ? queryKey.join(":") : queryKey;
    this.pendingInvalidations.add({ queryKey, options, keyString });

    // Clear existing timeout and set new one
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.flushInvalidations();
    }, this.debounceDelay);
  }

  /**
   * Execute all pending invalidations
   */
  flushInvalidations() {
    if (this.pendingInvalidations.size === 0) return;

    // Group invalidations by type for batch processing
    const groupedInvalidations = this.groupInvalidations();

    // Execute invalidations in optimal order
    this.executeGroupedInvalidations(groupedInvalidations);

    // Clear pending invalidations
    this.pendingInvalidations.clear();
    this.debounceTimeout = null;
  }

  /**
   * Group invalidations by query type for efficient batch processing
   */
  groupInvalidations() {
    const groups = {
      nfts: [],
      marketplace: [],
      auctions: [],
      user: [],
      platform: [],
    };

    this.pendingInvalidations.forEach(({ queryKey, options }) => {
      const keyString = Array.isArray(queryKey) ? queryKey[0] : queryKey;

      if (keyString.includes("nfts")) {
        groups.nfts.push({ queryKey, options });
      } else if (keyString.includes("marketplace")) {
        groups.marketplace.push({ queryKey, options });
      } else if (keyString.includes("auctions")) {
        groups.auctions.push({ queryKey, options });
      } else if (keyString.includes("user")) {
        groups.user.push({ queryKey, options });
      } else {
        groups.platform.push({ queryKey, options });
      }
    });

    return groups;
  }

  /**
   * Execute grouped invalidations in optimal order
   */
  executeGroupedInvalidations(groups) {
    // Execute in order of dependency: platform -> user -> nfts -> marketplace -> auctions
    const executionOrder = [
      "platform",
      "user",
      "nfts",
      "marketplace",
      "auctions",
    ];

    executionOrder.forEach((groupName) => {
      const group = groups[groupName];
      if (group.length > 0) {
        this.executeInvalidationGroup(group);
      }
    });
  }

  /**
   * Execute a group of invalidations
   */
  executeInvalidationGroup(invalidations) {
    // Deduplicate by query key
    const uniqueInvalidations = new Map();
    invalidations.forEach(({ queryKey, options }) => {
      const keyString = Array.isArray(queryKey) ? queryKey.join(":") : queryKey;
      uniqueInvalidations.set(keyString, { queryKey, options });
    });

    // Execute unique invalidations
    uniqueInvalidations.forEach(({ queryKey, options }) => {
      this.queryClient.invalidateQueries({
        queryKey,
        ...options,
      });
    });
  }

  /**
   * Force immediate invalidation without debouncing
   */
  invalidateImmediately(queryKey, options = {}) {
    this.queryClient.invalidateQueries({
      queryKey,
      ...options,
    });
  }
}

/**
 * Smart invalidation strategies for different transaction types
 */
export class SmartInvalidationManager {
  constructor(queryClient) {
    this.queryClient = queryClient;
    this.invalidationManager = new InvalidationManager(queryClient);
  }

  /**
   * Handle NFT mint transaction
   */
  handleNFTMint(userAddress, tokenId) {
    // Invalidate user's NFT collections
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byOwner(userAddress)
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byCreator(userAddress)
    );

    // Invalidate user stats
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.user.stats(userAddress)
    );

    // Invalidate platform stats
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.platform.stats()
    );
  }

  /**
   * Handle marketplace listing transaction
   */
  handleMarketplaceListing(userAddress, tokenId) {
    // Invalidate marketplace listings
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.marketplace.all()
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.marketplace.userListings(userAddress)
    );

    // Invalidate NFT data (ownership might change)
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byId(tokenId)
    );

    // Invalidate user stats
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.user.stats(userAddress)
    );
  }

  /**
   * Handle marketplace purchase transaction
   */
  handleMarketplacePurchase(buyerAddress, sellerAddress, tokenId) {
    // Invalidate marketplace listings
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.marketplace.all()
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.marketplace.userListings(sellerAddress)
    );

    // Invalidate NFT ownership
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byId(tokenId)
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byOwner(buyerAddress)
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byOwner(sellerAddress)
    );

    // Invalidate user stats for both parties
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.user.stats(buyerAddress)
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.user.stats(sellerAddress)
    );

    // Invalidate platform stats
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.platform.stats()
    );
  }

  /**
   * Handle auction creation transaction
   */
  handleAuctionCreation(userAddress, tokenId, auctionId) {
    // Invalidate auction listings
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.auctions.all()
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.auctions.userAuctions(userAddress)
    );

    // Invalidate NFT data
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byId(tokenId)
    );

    // Invalidate user stats
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.user.stats(userAddress)
    );
  }

  /**
   * Handle auction bid transaction
   */
  handleAuctionBid(bidderAddress, auctionId) {
    // Invalidate specific auction data immediately (real-time critical)
    this.invalidationManager.invalidateImmediately(
      queryKeyFactory.auctions.byId(auctionId)
    );

    // Invalidate auction listings with debounce
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.auctions.all()
    );

    // Invalidate user stats
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.user.stats(bidderAddress)
    );
  }

  /**
   * Handle auction settlement transaction
   */
  handleAuctionSettlement(winnerAddress, sellerAddress, tokenId, auctionId) {
    // Invalidate auction data
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.auctions.byId(auctionId)
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.auctions.all()
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.auctions.userAuctions(sellerAddress)
    );

    // Invalidate NFT ownership
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byId(tokenId)
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byOwner(winnerAddress)
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.nfts.byOwner(sellerAddress)
    );

    // Invalidate user stats for both parties
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.user.stats(winnerAddress)
    );
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.user.stats(sellerAddress)
    );

    // Invalidate platform stats
    this.invalidationManager.scheduleInvalidation(
      queryKeyFactory.platform.stats()
    );
  }

  /**
   * Force flush all pending invalidations
   */
  flush() {
    this.invalidationManager.flushInvalidations();
  }

  /**
   * Set debounce delay for invalidations
   */
  setDebounceDelay(delay) {
    this.invalidationManager.debounceDelay = delay;
  }
}

/**
 * Create smart invalidation manager instance
 */
export const createSmartInvalidationManager = (queryClient) => {
  return new SmartInvalidationManager(queryClient);
};

/**
 * Selective invalidation utilities
 */
export const selectiveInvalidation = {
  /**
   * Invalidate only stale queries
   */
  invalidateStale: (queryClient, queryKey) => {
    const queries = queryClient.getQueryCache().findAll({ queryKey });
    const staleQueries = queries.filter((query) => query.isStale());

    if (staleQueries.length > 0) {
      queryClient.invalidateQueries({ queryKey });
    }
  },

  /**
   * Invalidate queries older than specified time
   */
  invalidateOlderThan: (queryClient, queryKey, maxAge) => {
    const queries = queryClient.getQueryCache().findAll({ queryKey });
    const now = Date.now();

    const oldQueries = queries.filter((query) => {
      const dataUpdatedAt = query.state.dataUpdatedAt;
      return dataUpdatedAt && now - dataUpdatedAt > maxAge;
    });

    if (oldQueries.length > 0) {
      queryClient.invalidateQueries({ queryKey });
    }
  },

  /**
   * Invalidate queries with specific predicate
   */
  invalidateWhere: (queryClient, predicate) => {
    const allQueries = queryClient.getQueryCache().getAll();
    const matchingQueries = allQueries.filter(predicate);

    matchingQueries.forEach((query) => {
      queryClient.invalidateQueries({ queryKey: query.queryKey });
    });
  },
};
