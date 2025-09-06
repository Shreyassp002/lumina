'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { LUMINA_MARKETPLACE_ABI, LUMINA_MARKETPLACE_ADDRESS } from '../../abi/luminaMarketplace';
import { LUMINA_NFT_ABI, LUMINA_NFT_ADDRESS } from '../../abi/luminaNft';
import NFTCard from './NFTCard';
import { Loader2 } from 'lucide-react';

export default function NFTGrid({ searchTerm, filters }) {
  const { address } = useAccount();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch active listings from marketplace
  const { data: activeListings, refetch } = useReadContract({
    address: LUMINA_MARKETPLACE_ADDRESS,
    abi: LUMINA_MARKETPLACE_ABI,
    functionName: 'getActiveListings',
    args: [page * 20, 20], // offset, limit
  });

  useEffect(() => {
    if (activeListings) {
      const [listingData, tokenIds] = activeListings;
      
      if (listingData && tokenIds) {
        const newListings = listingData.map((listing, index) => ({
          ...listing,
          tokenId: tokenIds[index],
          listingId: index + (page * 20)
        }));
        
        if (page === 0) {
          setListings(newListings);
        } else {
          setListings(prev => [...prev, ...newListings]);
        }
        
        setHasMore(newListings.length === 20);
      }
      setLoading(false);
    }
  }, [activeListings, page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Filter listings based on search and filters
  const filteredListings = listings.filter(listing => {
    // Search filter
    if (searchTerm) {
      // This would need to be enhanced with actual metadata fetching
      // For now, we'll just filter by token ID
      const searchLower = searchTerm.toLowerCase();
      if (!listing.tokenId.toString().includes(searchLower)) {
        return false;
      }
    }

    // Category filter
    if (filters.category !== 'all') {
      // This would need to be enhanced with actual category data
      // For now, we'll skip this filter
    }

    // Price range filter
    if (listing.price < filters.priceRange[0] || listing.price > filters.priceRange[1]) {
      return false;
    }

    return true;
  });

  if (loading && page === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (filteredListings.length === 0 && !loading) {
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
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
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
