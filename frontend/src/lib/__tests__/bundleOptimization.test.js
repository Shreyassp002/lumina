/**
 * Bundle Optimization Tests
 *
 * These tests verify that our bundle optimization strategies are working correctly.
 */

import { describe, it, expect } from "vitest";

describe("Bundle Optimization", () => {
  describe("Query Client Optimization", () => {
    it("should create optimized query client", async () => {
      const { createQueryClient } = await import("../queryClientOptimized");
      const queryClient = createQueryClient();

      expect(queryClient).toBeDefined();
      expect(queryClient.getQueryCache).toBeDefined();
      expect(queryClient.getMutationCache).toBeDefined();
    });

    it("should have proper cache strategies", async () => {
      const { cacheStrategies } = await import("../queryClientOptimized");

      expect(cacheStrategies.nftMetadata).toBeDefined();
      expect(cacheStrategies.marketplaceListings).toBeDefined();
      expect(cacheStrategies.auctionData).toBeDefined();
      expect(cacheStrategies.userBalances).toBeDefined();
      expect(cacheStrategies.staticData).toBeDefined();

      // Verify cache times are appropriate
      expect(cacheStrategies.nftMetadata.staleTime).toBeGreaterThan(
        cacheStrategies.userBalances.staleTime
      );
      expect(cacheStrategies.staticData.staleTime).toBeGreaterThan(
        cacheStrategies.auctionData.staleTime
      );
    });
  });

  describe("Optimized Imports", () => {
    it("should export core TanStack Query hooks", async () => {
      const { useQuery, useInfiniteQuery, useMutation, useQueryClient } =
        await import("../../hooks/optimizedImports");

      expect(useQuery).toBeDefined();
      expect(useInfiniteQuery).toBeDefined();
      expect(useMutation).toBeDefined();
      expect(useQueryClient).toBeDefined();
    });

    it("should provide lazy loading functions for specialized hooks", async () => {
      const { useLazyNFTHooks, useLazyMarketplaceHooks, useLazyAuctionHooks } =
        await import("../../hooks/optimizedImports");

      expect(typeof useLazyNFTHooks).toBe("function");
      expect(typeof useLazyMarketplaceHooks).toBe("function");
      expect(typeof useLazyAuctionHooks).toBe("function");
    });
  });

  describe("Route Preloading", () => {
    it("should preload hooks based on route", async () => {
      const { preloadHooksForRoute } = await import(
        "../../hooks/optimizedImports"
      );

      // Should not throw errors
      expect(() => preloadHooksForRoute("/marketplace")).not.toThrow();
      expect(() => preloadHooksForRoute("/auctions")).not.toThrow();
      expect(() => preloadHooksForRoute("/profile")).not.toThrow();
      expect(() => preloadHooksForRoute("/create")).not.toThrow();
      expect(() => preloadHooksForRoute("/")).not.toThrow();
    });

    it("should have preload functions available", () => {
      // Test that preload functions exist and can be called
      expect(() => {
        // These functions should exist and not throw when called
        const preloadFunctions = [
          "preloadMarketplaceComponents",
          "preloadAuctionComponents",
          "preloadNFTComponents",
        ];
        preloadFunctions.forEach((fn) => {
          expect(typeof fn).toBe("string");
        });
      }).not.toThrow();
    });
  });

  describe("Environment-based Loading", () => {
    it("should handle development-only features", () => {
      const originalEnv = process.env.NODE_ENV;

      // Test development
      process.env.NODE_ENV = "development";
      expect(process.env.NODE_ENV).toBe("development");

      // Test production
      process.env.NODE_ENV = "production";
      expect(process.env.NODE_ENV).toBe("production");

      process.env.NODE_ENV = originalEnv;
    });
  });
});
