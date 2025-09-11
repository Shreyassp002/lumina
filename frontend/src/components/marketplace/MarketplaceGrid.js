"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { useInfiniteMarketplaceListings } from "../../hooks/useMarketplace";
import NFTCard from "../nft/NFTCard";
import { Loader2, RefreshCw, Search, Filter } from "lucide-react";
import { useInView } from "react-intersection-observer";

// Client-side filtering and search utilities
const filterListings = (listings, searchTerm, filters) => {
  return listings.filter((listing) => {
    // Search filter - search by token ID
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const tokenIdMatch = listing.tokenId.toString().includes(searchLower);
      const sellerMatch = listing.seller.toLowerCase().includes(searchLower);

      if (!tokenIdMatch && !sellerMatch) {
        return false;
      }
    }

    // Price range filter
    if (filters.priceRange && filters.priceRange.length === 2) {
      try {
        const minWei = BigInt(Math.floor(filters.priceRange[0] * 1e18));
        const maxWei = BigInt(Math.floor(filters.priceRange[1] * 1e18));
        if (listing.priceWei < minWei || listing.priceWei > maxWei) {
          return false;
        }
      } catch (e) {
        // If conversion fails, skip price filtering for this item
      }
    }

    // Category filter (if implemented in the future)
    if (filters.category && filters.category !== "all") {
      // This would require additional metadata
      // For now, we'll skip this filter
    }

    // Verified only filter (if implemented in the future)
    if (filters.verifiedOnly) {
      // This would require additional verification data
      // For now, we'll skip this filter
    }

    return true;
  });
};

// Sort listings based on sort criteria
const sortListings = (listings, sortBy) => {
  const sorted = [...listings];

  switch (sortBy) {
    case "price-low":
      return sorted.sort((a, b) => {
        const priceA = a.priceWei || BigInt(0);
        const priceB = b.priceWei || BigInt(0);
        return priceA < priceB ? -1 : priceA > priceB ? 1 : 0;
      });

    case "price-high":
      return sorted.sort((a, b) => {
        const priceA = a.priceWei || BigInt(0);
        const priceB = b.priceWei || BigInt(0);
        return priceA > priceB ? -1 : priceA < priceB ? 1 : 0;
      });

    case "newest":
      return sorted.sort((a, b) => {
        // Sort by listing ID (newer listings have higher IDs)
        const idA = a.listingId || 0;
        const idB = b.listingId || 0;
        return idB - idA;
      });

    case "oldest":
      return sorted.sort((a, b) => {
        const idA = a.listingId || 0;
        const idB = b.listingId || 0;
        return idA - idB;
      });

    default:
      return sorted;
  }
};

export default function MarketplaceGrid({
  searchTerm = "",
  filters = {},
  showFilters = false,
  onFiltersChange = () => {},
}) {
  const { address } = useAccount();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Use the infinite query hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteMarketplaceListings(20);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px",
  });

  // Auto-load more when scrolling near the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages into a single array
  const allListings = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flat();
  }, [data]);

  // Apply client-side filtering and sorting
  const processedListings = useMemo(() => {
    let filtered = filterListings(allListings, debouncedSearchTerm, filters);
    return sortListings(filtered, filters.sortBy || "newest");
  }, [allListings, debouncedSearchTerm, filters]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    setLocalSearchTerm(e.target.value);
  }, []);

  // Loading state for initial load
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="ml-2 text-emerald-200">Loading marketplace...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-lg mb-4">
          Failed to load marketplace
        </div>
        <p className="text-red-300/70 mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={handleRefresh}
          className="px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (processedListings.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200/70 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by token ID or seller address..."
              value={localSearchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 glass-panel rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-3 glass-panel rounded-lg hover:neon-glow transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="text-green-200/70 text-lg mb-4">No NFTs found</div>
          <p className="text-green-200/60">
            {debouncedSearchTerm || Object.keys(filters).length > 0
              ? "Try adjusting your search terms or filters"
              : "No active listings at the moment"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200/70 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by token ID or seller address..."
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 glass-panel rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center px-4 py-3 glass-panel rounded-lg hover:neon-glow transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-emerald-200">
          Active Listings ({processedListings.length})
          {debouncedSearchTerm && (
            <span className="text-sm font-normal text-green-200/70 ml-2">
              for &quot;{debouncedSearchTerm}&quot;
            </span>
          )}
        </h2>

        {/* Sort Options */}
        <select
          value={filters.sortBy || "newest"}
          onChange={(e) =>
            onFiltersChange({ ...filters, sortBy: e.target.value })
          }
          className="px-3 py-2 glass-panel rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {processedListings.map((listing) => (
          <NFTCard
            key={`${listing.tokenId}-${listing.listingId}`}
            tokenId={listing.tokenId}
            price={listing.priceWei}
            seller={listing.seller}
            listingId={listing.listingId}
            isOptimistic={listing.isOptimistic}
          />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="text-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mr-2" />
              <span className="text-emerald-200">Loading more listings...</span>
            </div>
          ) : (
            <div className="text-green-200/60">Scroll down to load more</div>
          )}
        </div>
      )}

      {/* End of Results */}
      {!hasNextPage && processedListings.length > 0 && (
        <div className="text-center py-8">
          <div className="text-green-200/60">
            You&apos;ve reached the end of the listings
          </div>
        </div>
      )}
    </div>
  );
}
