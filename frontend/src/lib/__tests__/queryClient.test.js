/**
 * Tests for the query client configuration
 * These tests verify that the query client is properly configured
 */

import { createQueryClient, queryKeys, cacheStrategies } from "../queryClient";

describe("Query Client Configuration", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  test("should create query client with correct default options", () => {
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(defaultOptions.queries.gcTime).toBe(10 * 60 * 1000); // 10 minutes
    expect(defaultOptions.queries.refetchOnWindowFocus).toBe(false);
    expect(defaultOptions.queries.refetchOnReconnect).toBe(true);
  });

  test("should have correct cache strategies for different data types", () => {
    expect(cacheStrategies.nftMetadata.staleTime).toBe(24 * 60 * 60 * 1000); // 24 hours
    expect(cacheStrategies.auctionData.staleTime).toBe(30 * 1000); // 30 seconds
    expect(cacheStrategies.userBalances.staleTime).toBe(10 * 1000); // 10 seconds
  });

  test("should generate consistent query keys", () => {
    const tokenId = "123";
    const owner = "0x123...";

    expect(queryKeys.nfts.byId(tokenId)).toEqual(["nfts", "byId", tokenId]);
    expect(queryKeys.nfts.byOwner(owner)).toEqual(["nfts", "owner", owner]);
    expect(queryKeys.marketplace.all).toEqual(["marketplace"]);
  });

  test("should handle retry logic correctly", () => {
    const defaultOptions = queryClient.getDefaultOptions();
    const retryFn = defaultOptions.queries.retry;

    // Should not retry user rejections
    const userRejectionError = { code: "USER_REJECTED_REQUEST" };
    expect(retryFn(1, userRejectionError)).toBe(false);

    // Should retry network errors up to 3 times
    const networkError = { message: "Network error" };
    expect(retryFn(1, networkError)).toBe(true);
    expect(retryFn(2, networkError)).toBe(true);
    expect(retryFn(3, networkError)).toBe(false);
  });
});
