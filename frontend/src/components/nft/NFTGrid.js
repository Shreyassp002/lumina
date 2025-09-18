"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useInfiniteMarketplaceListings } from "../../hooks/useMarketplace";
import NFTCard from "./NFTCard";
import NFTDetailsModal from "./NFTDetailsModal";
import { Loader2, RefreshCw } from "lucide-react";

export default function NFTGrid({ searchTerm, filters }) {
  const { address } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [selectedNFTData, setSelectedNFTData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use infinite marketplace listings hook
  const { data, isLoading, refetch, fetchNextPage, hasNextPage } =
    useInfiniteMarketplaceListings(20);

  // Auto-refetch on marketplace updates
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener("marketplace:updated", handler);
    return () => window.removeEventListener("marketplace:updated", handler);
  }, [refetch]);

  const loadMore = () => {
    if (!isLoading && hasNextPage) {
      fetchNextPage();
    }
  };

  // Process listings data from infinite query
  const processedListings = data?.pages?.flat() || [];

  // Filter listings based on search and filters
  const filteredListings = processedListings.filter((listing) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!listing.tokenId.toString().includes(searchLower)) {
        return false;
      }
    }

    // Price range filter
    try {
      const minWei = BigInt(Math.floor(filters.priceRange[0] * 1e18));
      const maxWei = BigInt(Math.floor(filters.priceRange[1] * 1e18));
      if (listing.priceWei < minWei || listing.priceWei > maxWei) {
        return false;
      }
    } catch (e) {
      // If conversion fails, skip price filtering
    }

    return true;
  });

  if (isLoading && page === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (filteredListings.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-200/70 text-lg mb-4">No NFTs found</div>
        <p className="text-green-200/60">
          {searchTerm
            ? "Try adjusting your search terms"
            : "No active listings at the moment"}
        </p>
      </div>
    );
  }

  const handleCardClick = (tokenId, nftData) => {
    setSelectedTokenId(tokenId);
    setSelectedNFTData(nftData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTokenId(null);
    setSelectedNFTData(null);
  };

  return (
    <div>
      {/* Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-emerald-200">
          Active Listings ({filteredListings.length})
        </h2>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="flex items-center px-4 py-2 text-sm glass-panel rounded-lg hover:neon-glow transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredListings.map((listing) => (
          <NFTCard
            key={`${listing.tokenId}-${listing.listingId}`}
            tokenId={listing.tokenId}
            price={listing.priceWei}
            seller={listing.seller}
            listingId={listing.listingId}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {/* NFT Details Modal */}
      <NFTDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tokenId={selectedTokenId}
        initialData={selectedNFTData}
      />

      {/* Load More Button */}
      {hasNextPage && (
        <div className="text-center mt-12">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-semibold rounded-lg hover:from-emerald-400 hover:to-lime-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
