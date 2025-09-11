/**
 * Tests for the centralized query key management system
 */

import {
  queryKeyFactory,
  nftKeys,
  marketplaceKeys,
  auctionKeys,
  userKeys,
  platformKeys,
  metadataKeys,
  QueryKeyTypes,
} from "../queryKeys";

describe("Query Key Management System", () => {
  describe("NFT Keys", () => {
    test("should generate consistent NFT query keys", () => {
      const tokenId = "123";
      const address = "0x1234567890123456789012345678901234567890";

      expect(nftKeys.all()).toEqual(["nfts"]);
      expect(nftKeys.byId(tokenId)).toEqual(["nfts", "byId", "123"]);
      expect(nftKeys.metadata(tokenId)).toEqual(["nfts", "metadata", "123"]);
      expect(nftKeys.byOwner(address)).toEqual([
        "nfts",
        "owner",
        address.toLowerCase(),
      ]);
      expect(nftKeys.byCreator(address)).toEqual([
        "nfts",
        "creator",
        address.toLowerCase(),
      ]);
    });

    test("should handle null/undefined addresses gracefully", () => {
      expect(nftKeys.byOwner(null)).toEqual(["nfts", "owner", undefined]);
      expect(nftKeys.byOwner(undefined)).toEqual(["nfts", "owner", undefined]);
    });

    test("should normalize addresses to lowercase", () => {
      const upperAddress = "0xABCDEF1234567890123456789012345678901234";
      const lowerAddress = upperAddress.toLowerCase();

      expect(nftKeys.byOwner(upperAddress)).toEqual([
        "nfts",
        "owner",
        lowerAddress,
      ]);
      expect(nftKeys.byCreator(upperAddress)).toEqual([
        "nfts",
        "creator",
        lowerAddress,
      ]);
    });
  });

  describe("Marketplace Keys", () => {
    test("should generate marketplace query keys with pagination", () => {
      const offset = 20;
      const limit = 10;
      const filters = { category: "art", priceMin: "1000" };

      expect(marketplaceKeys.all()).toEqual(["marketplace"]);
      expect(marketplaceKeys.listings(offset, limit, filters)).toEqual([
        "marketplace",
        "listings",
        { offset: 20, limit: 10, category: "art", priceMin: "1000" },
      ]);
    });

    test("should handle default pagination parameters", () => {
      expect(marketplaceKeys.listings()).toEqual([
        "marketplace",
        "listings",
        { offset: 0, limit: 20 },
      ]);
    });

    test("should generate user-specific marketplace keys", () => {
      const address = "0x1234567890123456789012345678901234567890";

      expect(marketplaceKeys.userListings(address)).toEqual([
        "marketplace",
        "userListings",
        address.toLowerCase(),
      ]);
    });

    test("should generate search query keys", () => {
      const query = "rare nft";
      const filters = { category: "collectibles" };

      expect(marketplaceKeys.search(query, filters)).toEqual([
        "marketplace",
        "search",
        { query: "rare nft", category: "collectibles" },
      ]);
    });
  });

  describe("Auction Keys", () => {
    test("should generate auction query keys", () => {
      const auctionId = "456";
      const address = "0x1234567890123456789012345678901234567890";

      expect(auctionKeys.all()).toEqual(["auctions"]);
      expect(auctionKeys.active()).toEqual(["auctions", "active"]);
      expect(auctionKeys.byId(auctionId)).toEqual(["auctions", "byId", "456"]);
      expect(auctionKeys.userAuctions(address)).toEqual([
        "auctions",
        "userAuctions",
        address.toLowerCase(),
      ]);
      expect(auctionKeys.bids(auctionId)).toEqual(["auctions", "bids", "456"]);
    });

    test("should generate status-based auction keys", () => {
      expect(auctionKeys.byStatus("active")).toEqual([
        "auctions",
        "status",
        "active",
      ]);
      expect(auctionKeys.byStatus("ended")).toEqual([
        "auctions",
        "status",
        "ended",
      ]);
    });
  });

  describe("User Keys", () => {
    test("should generate user query keys", () => {
      const address = "0x1234567890123456789012345678901234567890";

      expect(userKeys.all()).toEqual(["user"]);
      expect(userKeys.profile(address)).toEqual([
        "user",
        "profile",
        address.toLowerCase(),
      ]);
      expect(userKeys.balance(address)).toEqual([
        "user",
        "balance",
        address.toLowerCase(),
      ]);
      expect(userKeys.stats(address)).toEqual([
        "user",
        "stats",
        address.toLowerCase(),
      ]);
      expect(userKeys.nfts(address)).toEqual([
        "user",
        "nfts",
        address.toLowerCase(),
      ]);
    });

    test("should generate user activity keys", () => {
      const address = "0x1234567890123456789012345678901234567890";

      expect(userKeys.transactions(address)).toEqual([
        "user",
        "transactions",
        address.toLowerCase(),
      ]);
      expect(userKeys.activity(address)).toEqual([
        "user",
        "activity",
        address.toLowerCase(),
      ]);
    });
  });

  describe("Platform Keys", () => {
    test("should generate platform-wide query keys", () => {
      expect(platformKeys.all()).toEqual(["platform"]);
      expect(platformKeys.stats()).toEqual(["platform", "stats"]);
      expect(platformKeys.featured()).toEqual(["platform", "featured"]);
      expect(platformKeys.trending()).toEqual(["platform", "trending"]);
    });
  });

  describe("Metadata Keys", () => {
    test("should generate metadata query keys", () => {
      const ipfsUri = "ipfs://QmTest123";
      const imageUrl = "https://example.com/image.jpg";

      expect(metadataKeys.all()).toEqual(["metadata"]);
      expect(metadataKeys.ipfs(ipfsUri)).toEqual(["metadata", "ipfs", ipfsUri]);
      expect(metadataKeys.image(imageUrl)).toEqual([
        "metadata",
        "image",
        imageUrl,
      ]);
    });
  });

  describe("Query Key Factory", () => {
    test("should provide access to all key factories", () => {
      expect(queryKeyFactory.nfts).toBe(nftKeys);
      expect(queryKeyFactory.marketplace).toBe(marketplaceKeys);
      expect(queryKeyFactory.auctions).toBe(auctionKeys);
      expect(queryKeyFactory.user).toBe(userKeys);
      expect(queryKeyFactory.platform).toBe(platformKeys);
      expect(queryKeyFactory.metadata).toBe(metadataKeys);
    });
  });

  describe("Query Key Types", () => {
    test("should define all required query key types", () => {
      expect(QueryKeyTypes.NFTS).toBe("nfts");
      expect(QueryKeyTypes.MARKETPLACE).toBe("marketplace");
      expect(QueryKeyTypes.AUCTIONS).toBe("auctions");
      expect(QueryKeyTypes.USER).toBe("user");
      expect(QueryKeyTypes.PLATFORM).toBe("platform");
      expect(QueryKeyTypes.METADATA).toBe("metadata");
    });
  });

  describe("Key Consistency", () => {
    test("should generate identical keys for identical inputs", () => {
      const tokenId = "123";
      const address = "0x1234567890123456789012345678901234567890";

      // Test multiple calls return identical keys
      expect(nftKeys.byId(tokenId)).toEqual(nftKeys.byId(tokenId));
      expect(userKeys.profile(address)).toEqual(userKeys.profile(address));
      expect(marketplaceKeys.listings(0, 20)).toEqual(
        marketplaceKeys.listings(0, 20)
      );
    });

    test("should generate different keys for different inputs", () => {
      expect(nftKeys.byId("123")).not.toEqual(nftKeys.byId("456"));
      expect(userKeys.profile("0x123")).not.toEqual(userKeys.profile("0x456"));
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty strings", () => {
      expect(nftKeys.byId("")).toEqual(["nfts", "byId", ""]);
      expect(userKeys.profile("")).toEqual(["user", "profile", ""]);
    });

    test("should handle special characters in filters", () => {
      const filters = {
        name: 'NFT with "quotes" and spaces',
        category: "art & collectibles",
      };

      const key = marketplaceKeys.listings(0, 20, filters);
      expect(key).toEqual([
        "marketplace",
        "listings",
        { offset: 0, limit: 20, ...filters },
      ]);
    });

    test("should handle numeric inputs as strings", () => {
      expect(nftKeys.byId(123)).toEqual(["nfts", "byId", "123"]);
      expect(auctionKeys.byId(456)).toEqual(["auctions", "byId", "456"]);
    });
  });
});
