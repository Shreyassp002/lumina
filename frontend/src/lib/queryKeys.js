/**
 * Centralized Query Key Management System
 *
 * This module provides a typed query key factory for consistent key generation
 * across the entire application. It ensures proper cache invalidation and
 * prevents key conflicts between different data types.
 */

// Base query key types for type safety and consistency
const QueryKeyTypes = {
  NFTS: "nfts",
  MARKETPLACE: "marketplace",
  AUCTIONS: "auctions",
  USER: "user",
  PLATFORM: "platform",
  METADATA: "metadata",
};

/**
 * NFT-related query keys
 * Handles all NFT data including metadata, ownership, and creation info
 */
export const nftKeys = {
  // Base key for all NFT queries
  all: () => [QueryKeyTypes.NFTS],

  // Individual NFT data
  byId: (tokenId) => [...nftKeys.all(), "byId", String(tokenId)],

  // NFT metadata (cached longer due to immutability)
  metadata: (tokenId) => [...nftKeys.all(), "metadata", String(tokenId)],

  // NFT ownership queries
  byOwner: (ownerAddress) => [
    ...nftKeys.all(),
    "owner",
    ownerAddress?.toLowerCase(),
  ],

  // NFT creation queries
  byCreator: (creatorAddress) => [
    ...nftKeys.all(),
    "creator",
    creatorAddress?.toLowerCase(),
  ],

  // Token URI and data
  tokenURI: (tokenId) => [...nftKeys.all(), "tokenURI", String(tokenId)],
  tokenData: (tokenId) => [...nftKeys.all(), "tokenData", String(tokenId)],

  // Creator profile data
  creatorProfile: (address) => [
    ...nftKeys.all(),
    "creatorProfile",
    address?.toLowerCase(),
  ],

  // NFT collection queries
  collection: (filters = {}) => [...nftKeys.all(), "collection", filters],

  // User's NFT balance
  userBalance: (address) => [
    ...nftKeys.all(),
    "balance",
    address?.toLowerCase(),
  ],
};

/**
 * Marketplace-related query keys
 * Handles listings, sales, and marketplace statistics
 */
export const marketplaceKeys = {
  // Base key for all marketplace queries
  all: () => [QueryKeyTypes.MARKETPLACE],

  // Active listings with pagination and filters
  listings: (offset = 0, limit = 20, filters = {}) => [
    ...marketplaceKeys.all(),
    "listings",
    { offset, limit, ...filters },
  ],

  // Individual listing data
  listing: (listingId) => [
    ...marketplaceKeys.all(),
    "listing",
    String(listingId),
  ],

  // User's active listings
  userListings: (userAddress) => [
    ...marketplaceKeys.all(),
    "userListings",
    userAddress?.toLowerCase(),
  ],

  // Marketplace statistics
  stats: () => [...marketplaceKeys.all(), "stats"],

  // Platform volume and sales data
  volume: () => [...marketplaceKeys.all(), "volume"],
  totalSales: () => [...marketplaceKeys.all(), "totalSales"],

  // Listing count
  activeCount: () => [...marketplaceKeys.all(), "activeCount"],

  // Search and filter results
  search: (query, filters = {}) => [
    ...marketplaceKeys.all(),
    "search",
    { query, ...filters },
  ],
};

/**
 * Auction-related query keys
 * Handles auction data, bids, and auction statistics
 */
export const auctionKeys = {
  // Base key for all auction queries
  all: () => [QueryKeyTypes.AUCTIONS],

  // All active auctions
  active: () => [...auctionKeys.all(), "active"],

  // Individual auction data
  byId: (auctionId) => [...auctionKeys.all(), "byId", String(auctionId)],

  // User's auctions (as seller)
  userAuctions: (userAddress) => [
    ...auctionKeys.all(),
    "userAuctions",
    userAddress?.toLowerCase(),
  ],

  // Auction bids
  bids: (auctionId) => [...auctionKeys.all(), "bids", String(auctionId)],

  // User's bids (as bidder)
  userBids: (userAddress) => [
    ...auctionKeys.all(),
    "userBids",
    userAddress?.toLowerCase(),
  ],

  // Auction count
  count: () => [...auctionKeys.all(), "count"],

  // Auction statistics
  stats: () => [...auctionKeys.all(), "stats"],

  // Ended auctions
  ended: () => [...auctionKeys.all(), "ended"],

  // Auctions by status
  byStatus: (status) => [...auctionKeys.all(), "status", status],
};

/**
 * User-related query keys
 * Handles user profiles, balances, and statistics
 */
export const userKeys = {
  // Base key for all user queries
  all: () => [QueryKeyTypes.USER],

  // User profile data
  profile: (address) => [...userKeys.all(), "profile", address?.toLowerCase()],

  // User's ETH balance
  balance: (address) => [...userKeys.all(), "balance", address?.toLowerCase()],

  // User statistics (owned NFTs, sales, etc.)
  stats: (address) => [...userKeys.all(), "stats", address?.toLowerCase()],

  // User's owned NFTs
  nfts: (address) => [...userKeys.all(), "nfts", address?.toLowerCase()],

  // User's created NFTs
  createdNFTs: (address) => [
    ...userKeys.all(),
    "createdNFTs",
    address?.toLowerCase(),
  ],

  // User's transaction history
  transactions: (address) => [
    ...userKeys.all(),
    "transactions",
    address?.toLowerCase(),
  ],

  // User's activity feed
  activity: (address) => [
    ...userKeys.all(),
    "activity",
    address?.toLowerCase(),
  ],
};

/**
 * Platform-wide query keys
 * Handles global statistics and platform data
 */
export const platformKeys = {
  // Base key for all platform queries
  all: () => [QueryKeyTypes.PLATFORM],

  // Global platform statistics
  stats: () => [...platformKeys.all(), "stats"],

  // Featured NFTs
  featured: () => [...platformKeys.all(), "featured"],

  // Trending collections
  trending: () => [...platformKeys.all(), "trending"],

  // Recent activity
  recentActivity: () => [...platformKeys.all(), "recentActivity"],
};

/**
 * Metadata-related query keys
 * Handles IPFS metadata and external data
 */
export const metadataKeys = {
  // Base key for all metadata queries
  all: () => [QueryKeyTypes.METADATA],

  // IPFS metadata by URI
  ipfs: (uri) => [...metadataKeys.all(), "ipfs", uri],

  // Image metadata and optimization
  image: (imageUrl) => [...metadataKeys.all(), "image", imageUrl],
};

/**
 * Centralized query key factory
 * Provides a single interface for all query key generation
 */
export const queryKeyFactory = {
  nfts: nftKeys,
  marketplace: marketplaceKeys,
  auctions: auctionKeys,
  user: userKeys,
  platform: platformKeys,
  metadata: metadataKeys,
};

// Individual key factories are already exported as const above

// Export query key types for type checking
export { QueryKeyTypes };
