/**
 * Integration test to verify the NFT hooks work correctly
 */

import { describe, it, expect } from "vitest";
import {
  fetchMetadataWithFallback,
  normalizeNFTData,
  processBatch,
  generatePlaceholder,
  validateMetadata,
} from "../../lib/nftUtils";

describe("NFT Utils Integration", () => {
  it("should normalize NFT data correctly", () => {
    const rawData = {
      tokenId: "123",
      tokenURI: "ipfs://test-uri",
      tokenData: {
        creator: "0xCreator",
        royaltyBps: 500,
        category: "Art",
      },
      owner: "0xOwner",
      metadata: {
        name: "Test NFT",
        description: "A test NFT",
        image: "ipfs://test-image",
        attributes: [
          { trait_type: "Color", value: "Blue" },
          { trait_type: "Rarity", value: "Common" },
        ],
      },
      imageUrl: "https://ipfs.io/ipfs/test-image",
    };

    const normalized = normalizeNFTData(rawData);

    expect(normalized).toMatchObject({
      tokenId: "123",
      name: "Test NFT",
      description: "A test NFT",
      creator: "0xcreator", // Should be lowercase
      owner: "0xowner", // Should be lowercase
      royaltyBps: 500,
      category: "Art",
      imageUrl: "https://ipfs.io/ipfs/test-image",
      attributes: [
        { trait_type: "Color", value: "Blue" },
        { trait_type: "Rarity", value: "Common" },
      ],
    });
  });

  it("should process batches correctly", async () => {
    const items = [1, 2, 3, 4, 5];
    const processor = async (item) => item * 2;

    const results = await processBatch(items, processor, 2, 10);

    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it("should generate placeholder images", () => {
    const placeholder = generatePlaceholder(200, 200, "NFT #123");

    expect(placeholder).toContain("data:image/svg+xml;base64,");

    // Decode the base64 to check the content
    const base64Content = placeholder.split("base64,")[1];
    const decodedContent = atob(base64Content);
    expect(decodedContent).toContain("NFT #123");
  });

  it("should validate metadata correctly", () => {
    const validMetadata = {
      name: "Test NFT",
      description: "A test NFT",
      image: "ipfs://test-image",
      attributes: [{ trait_type: "Color", value: "Blue" }],
    };

    const validation = validateMetadata(validMetadata);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should detect invalid metadata", () => {
    const invalidMetadata = {
      // Missing name and image
      description: "A test NFT",
    };

    const validation = validateMetadata(invalidMetadata);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("Missing required field: name");
    expect(validation.errors).toContain(
      "Missing required field: image or animation_url"
    );
  });
});

describe("Query Key Factory", () => {
  it("should generate consistent query keys", () => {
    const { queryKeyFactory } = require("../../lib/queryKeys");

    const nftKey1 = queryKeyFactory.nfts.byId("123");
    const nftKey2 = queryKeyFactory.nfts.byId("123");

    expect(nftKey1).toEqual(nftKey2);
    expect(nftKey1).toEqual(["nfts", "byId", "123"]);
  });

  it("should generate different keys for different data", () => {
    const { queryKeyFactory } = require("../../lib/queryKeys");

    const nftKey = queryKeyFactory.nfts.byId("123");
    const userKey = queryKeyFactory.user.nfts("0xuser");

    expect(nftKey).not.toEqual(userKey);
  });
});

describe("Cache Strategies", () => {
  it("should have appropriate cache times for different data types", () => {
    const { cacheStrategies } = require("../../lib/queryClient");

    // NFT metadata should have long cache time (rarely changes)
    expect(cacheStrategies.nftMetadata.staleTime).toBeGreaterThan(
      cacheStrategies.userBalances.staleTime
    );

    // User balances should have short cache time (real-time critical)
    expect(cacheStrategies.userBalances.staleTime).toBeLessThan(
      cacheStrategies.marketplaceListings.staleTime
    );
  });
});
