'use client';

import { useUserNFTs } from './useNFT';
import { useUserListings } from './useMarketplace';
import { useUserAuctions } from './useAuction';
import { useState, useEffect } from 'react';

export function useUserStats(address) {
  const { nfts: ownedNFTs, balance, isLoading: nftsLoading } = useUserNFTs(address);
  const { listings: userListings, isLoading: listingsLoading } = useUserListings(address);
  const { auctions: userAuctions, isLoading: auctionsLoading } = useUserAuctions(address);
  
  const [stats, setStats] = useState({
    owned: 0,
    created: 0,
    sold: 0,
    totalVolume: 0,
    activeListings: 0,
    activeAuctions: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address || nftsLoading || listingsLoading || auctionsLoading) {
      setIsLoading(nftsLoading || listingsLoading || auctionsLoading);
      return;
    }

    const calculateStats = async () => {
      try {
        // Count owned NFTs
        const owned = balance || 0;

        // Count created NFTs (this would need to be tracked differently in a real app)
        // For now, we'll estimate based on owned NFTs
        const created = owned; // This is a simplification

        // Count active listings
        const activeListings = userListings.filter(listing => listing.active).length;

        // Count active auctions
        const now = Date.now();
        const activeAuctions = userAuctions.filter(auction => 
          auction.active && auction.endTime > now
        ).length;

        // Calculate total volume (this would need transaction history in a real app)
        const totalVolume = 0; // Placeholder - would need to fetch from transaction history

        // Calculate total earnings (this would need transaction history in a real app)
        const totalEarnings = 0; // Placeholder - would need to fetch from transaction history

        // Count sold NFTs (this would need transaction history in a real app)
        const sold = 0; // Placeholder - would need to fetch from transaction history

        setStats({
          owned,
          created,
          sold,
          totalVolume,
          activeListings,
          activeAuctions,
          totalEarnings,
        });
      } catch (error) {
        console.error('Error calculating user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateStats();
  }, [address, balance, userListings, userAuctions, nftsLoading, listingsLoading, auctionsLoading]);

  return {
    stats,
    ownedNFTs,
    userListings,
    userAuctions,
    isLoading,
  };
}
