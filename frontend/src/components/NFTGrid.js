'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useActiveListings } from '../hooks/useMarketplace';
import NFTCard from './NFTCard';
import { Loader2 } from 'lucide-react';

export default function NFTGrid({ searchTerm, filters }) {
  const { address } = useAccount();
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Use custom hook to fetch active listings
  const { listings: activeListings, isLoading, refetch } = useActiveListings(page * 20, 20);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Process listings data
  const processedListings = activeListings ? (() => {
    const [listingData, tokenIds] = activeListings;
    if (listingData && tokenIds) {
      return listingData.map((listing, index) => ({
        ...listing,
        tokenId: tokenIds[index],
        listingId: index + (page * 20)
      }));
    }
    return [];
  })() : [];

  // Filter listings based on search and filters
  const filteredListings = processedListings.filter(listing => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!listing.tokenId.toString().includes(searchLower)) {
        return false;
      }
    }

    // Price range filter
    if (listing.price < filters.priceRange[0] || listing.price > filters.priceRange[1]) {
      return false;
    }

    return true;
  });

  if (isLoading && page === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (filteredListings.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No NFTs found</div>
        <p className="text-gray-400">
          {searchTerm ? 'Try adjusting your search terms' : 'No active listings at the moment'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredListings.map((listing) => (
          <NFTCard
            key={`${listing.tokenId}-${listing.listingId}`}
            tokenId={listing.tokenId}
            price={listing.price}
            seller={listing.seller}
            listingId={listing.listingId}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-12">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
