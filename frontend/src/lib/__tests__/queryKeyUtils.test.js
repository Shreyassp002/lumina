/**
 * Tests for query key utilities and cache management
 */

import { vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  QueryInvalidationManager,
  QueryPrefetchManager,
  QueryCacheManager,
  queryKeyUtils,
  createQueryUtils,
} from "../queryKeyUtils";
import { queryKeyFactory } from "../queryKeys";

// Mock QueryClient for testing
const createMockQueryClient = () => {
  const mockQueries = new Map();
  const mockQueryCache = {
    getAll: vi.fn(() => Array.from(mockQueries.values())),
  };

  return {
    invalidateQueries: vi.fn(),
    prefetchQuery: vi.fn(),
    removeQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    getQueryCache: vi.fn(() => mockQueryCache),
    // Helper to add mock queries for testing
    _addMockQuery: (queryKey, data = {}) => {
      const query = {
        queryKey,
        state: {
          dataUpdatedAt: Date.now(),
          error: null,
          ...data,
        },
        isStale: vi.fn(() => false),
      };
      mockQueries.set(queryKey.join("-"), query);
      return query;
    },
    _clearMockQueries: () => mockQueries.clear(),
  };
};

describe("Query Key Utilities", () => {
  let mockQueryClient;
  let invalidationManager;
  let prefetchManager;
  let cacheManager;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    invalidationManager = new QueryInvalidationManager(mockQueryClient);
    prefetchManager = new QueryPrefetchManager(mockQueryClient);
    cacheManager = new QueryCacheManager(mockQueryClient);
  });

  describe("QueryInvalidationManager", () => {
    test("should invalidate NFT-related queries", async () => {
      const tokenId = "123";

      await invalidationManager.invalidateNFT(tokenId);

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.nfts.byId(tokenId),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.nfts.metadata(tokenId),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.nfts.tokenURI(tokenId),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.nfts.tokenData(tokenId),
      });
    });

    test("should invalidate user-related queries", async () => {
      const address = "0x1234567890123456789012345678901234567890";

      await invalidationManager.invalidateUser(address);

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.user.profile(address.toLowerCase()),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.user.balance(address.toLowerCase()),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.nfts.byOwner(address.toLowerCase()),
      });
    });

    test("should handle null address gracefully", async () => {
      await invalidationManager.invalidateUser(null);
      await invalidationManager.invalidateUserListings(undefined);

      // Should not throw errors and should not call invalidation
      expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
    });

    test("should invalidate marketplace queries", async () => {
      await invalidationManager.invalidateMarketplace();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.marketplace.all(),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.marketplace.stats(),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.platform.stats(),
      });
    });

    test("should handle transaction-based invalidation", async () => {
      const address = "0x1234567890123456789012345678901234567890";
      const tokenId = "123";

      await invalidationManager.invalidateOnTransaction("NFT_MINT", {
        userAddress: address,
        tokenId,
      });

      // Should invalidate user and NFT data
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.user.profile(address.toLowerCase()),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.nfts.byId(tokenId),
      });
    });

    test("should handle marketplace transaction invalidation", async () => {
      const buyerAddress = "0x1111111111111111111111111111111111111111";
      const sellerAddress = "0x2222222222222222222222222222222222222222";
      const tokenId = "123";

      await invalidationManager.invalidateOnTransaction("MARKETPLACE_BUY", {
        buyerAddress,
        sellerAddress,
        tokenId,
      });

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.user.profile(buyerAddress.toLowerCase()),
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.user.profile(sellerAddress.toLowerCase()),
      });
    });
  });

  describe("QueryPrefetchManager", () => {
    test("should prefetch user data", async () => {
      const address = "0x1234567890123456789012345678901234567890";

      await prefetchManager.prefetchUserData(address);

      expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.user.nfts(address.toLowerCase()),
        staleTime: 5 * 60 * 1000,
      });
      expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.marketplace.userListings(
          address.toLowerCase()
        ),
        staleTime: 2 * 60 * 1000,
      });
    });

    test("should prefetch next page of marketplace data", async () => {
      const currentOffset = 20;
      const limit = 10;
      const filters = { category: "art" };

      await prefetchManager.prefetchNextPage(currentOffset, limit, filters);

      expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.marketplace.listings(30, 10, filters),
        staleTime: 2 * 60 * 1000,
      });
    });

    test("should handle null address in prefetch", async () => {
      await prefetchManager.prefetchUserData(null);

      // Should not throw and should not call prefetch
      expect(mockQueryClient.prefetchQuery).not.toHaveBeenCalled();
    });
  });

  describe("QueryCacheManager", () => {
    beforeEach(() => {
      // Add some mock queries to test cache management
      mockQueryClient._addMockQuery(["nfts", "metadata", "123"], {
        dataUpdatedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      });
      mockQueryClient._addMockQuery(["nfts", "metadata", "456"], {
        dataUpdatedAt: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
      });
      mockQueryClient._addMockQuery(["marketplace", "listings"], {
        dataUpdatedAt: Date.now(),
      });
    });

    test("should remove stale NFT metadata", () => {
      cacheManager.removeStaleNFTMetadata(24 * 60 * 60 * 1000); // 24 hours

      expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: ["nfts", "metadata", "123"],
      });
      // Should not remove the 1-hour-old metadata
      expect(mockQueryClient.removeQueries).not.toHaveBeenCalledWith({
        queryKey: ["nfts", "metadata", "456"],
      });
    });

    test("should clear user cache", () => {
      const address = "0x1234567890123456789012345678901234567890";

      cacheManager.clearUserCache(address);

      expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: queryKeyFactory.user.all(),
      });
    });

    test("should get cache statistics", () => {
      const stats = cacheManager.getCacheStats();

      expect(stats).toHaveProperty("totalQueries");
      expect(stats).toHaveProperty("byType");
      expect(stats).toHaveProperty("staleCounts");
      expect(stats).toHaveProperty("errorCounts");
      expect(stats.totalQueries).toBe(3);
      expect(stats.byType.nfts).toBe(2);
      expect(stats.byType.marketplace).toBe(1);
    });

    test("should handle empty cache", () => {
      mockQueryClient._clearMockQueries();

      const stats = cacheManager.getCacheStats();

      expect(stats.totalQueries).toBe(0);
      expect(stats.byType).toEqual({});
    });
  });

  describe("queryKeyUtils", () => {
    test("should match query keys correctly", () => {
      const key1 = ["nfts", "byId", "123"];
      const key2 = ["nfts", "byId", "123"];
      const key3 = ["nfts", "byId", "456"];

      expect(queryKeyUtils.keysMatch(key1, key2)).toBe(true);
      expect(queryKeyUtils.keysMatch(key1, key3)).toBe(false);
      expect(queryKeyUtils.keysMatch(key1, ["nfts", "byId"])).toBe(false);
    });

    test("should extract address from query key", () => {
      const address = "0x1234567890123456789012345678901234567890";
      const key = ["user", "profile", address];

      expect(queryKeyUtils.extractAddress(key)).toBe(address);
      expect(queryKeyUtils.extractAddress(["nfts", "byId", "123"])).toBeNull();
    });

    test("should extract token ID from query key", () => {
      const key = ["nfts", "byId", "123"];

      expect(queryKeyUtils.extractTokenId(key)).toBe(123);
      expect(
        queryKeyUtils.extractTokenId(["user", "profile", "0x123"])
      ).toBeNull();
    });

    test("should create query key matcher", () => {
      const matcher = queryKeyUtils.createMatcher(["nfts", "*", "123"]);

      expect(matcher(["nfts", "byId", "123"])).toBe(true);
      expect(matcher(["nfts", "metadata", "123"])).toBe(true);
      expect(matcher(["nfts", "byId", "456"])).toBe(false);
      expect(matcher(["marketplace", "listings"])).toBe(false);
    });

    test("should handle wildcard patterns", () => {
      const matcher = queryKeyUtils.createMatcher(["*", "profile", "*"]);

      expect(matcher(["user", "profile", "0x123"])).toBe(true);
      expect(matcher(["admin", "profile", "0x456"])).toBe(true);
      expect(matcher(["user", "balance", "0x123"])).toBe(false);
    });
  });

  describe("createQueryUtils", () => {
    test("should create all utility managers", () => {
      const utils = createQueryUtils(mockQueryClient);

      expect(utils.invalidation).toBeInstanceOf(QueryInvalidationManager);
      expect(utils.prefetch).toBeInstanceOf(QueryPrefetchManager);
      expect(utils.cache).toBeInstanceOf(QueryCacheManager);
      expect(utils.utils).toBe(queryKeyUtils);
    });

    test("should use the same query client instance", () => {
      const utils = createQueryUtils(mockQueryClient);

      expect(utils.invalidation.queryClient).toBe(mockQueryClient);
      expect(utils.prefetch.queryClient).toBe(mockQueryClient);
      expect(utils.cache.queryClient).toBe(mockQueryClient);
    });
  });

  describe("Integration Tests", () => {
    test("should handle complex transaction invalidation flow", async () => {
      const utils = createQueryUtils(mockQueryClient);

      // Simulate a marketplace purchase
      await utils.invalidation.invalidateOnTransaction("MARKETPLACE_BUY", {
        buyerAddress: "0x1111111111111111111111111111111111111111",
        sellerAddress: "0x2222222222222222222222222222222222222222",
        tokenId: "123",
      });

      // Should invalidate multiple related queries
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(8); // Multiple invalidations
    });

    test("should handle prefetch and invalidation together", async () => {
      const utils = createQueryUtils(mockQueryClient);
      const address = "0x1234567890123456789012345678901234567890";

      // Prefetch user data
      await utils.prefetch.prefetchUserData(address);

      // Then invalidate it
      await utils.invalidation.invalidateUser(address);

      expect(mockQueryClient.prefetchQuery).toHaveBeenCalled();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});
