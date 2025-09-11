"use client";

import { useUserNFTs, useUserCreatedNFTs } from "./useOptimizedNFT";
import { useUserListings } from "./useOptimizedMarketplace";
import { useOptimizedUserAuctions } from "./useOptimizedAuction";
import { useState, useEffect, useMemo } from "react";

export function useUserStats(address) {
  // Use optimized hooks with performance options
  const { data: ownedNFTs = [], isLoading: nftsLoading } = useUserNFTs(
    address,
    {
      enabled: !!address,
      includeMetadata: true, // Include metadata to show images in profile
    }
  );
  const { data: createdNFTs = [], isLoading: createdLoading } =
    useUserCreatedNFTs(address, {
      enabled: !!address,
      includeMetadata: true, // Include metadata to show images in profile
    });
  const { data: userListings = [], isLoading: listingsLoading } =
    useUserListings(address);
  const { data: userAuctions = [], isLoading: auctionsLoading } =
    useOptimizedUserAuctions(address);

  // Memoize normalized data to prevent unnecessary recalculations
  const normalizedData = useMemo(
    () => ({
      ownedNFTs: Array.isArray(ownedNFTs) ? ownedNFTs : [],
      createdNFTs: Array.isArray(createdNFTs) ? createdNFTs : [],
      userListings: Array.isArray(userListings) ? userListings : [],
      userAuctions: Array.isArray(userAuctions) ? userAuctions : [],
    }),
    [ownedNFTs, createdNFTs, userListings, userAuctions]
  );

  // Memoize loading state
  const isLoading = useMemo(
    () => nftsLoading || createdLoading || listingsLoading || auctionsLoading,
    [nftsLoading, createdLoading, listingsLoading, auctionsLoading]
  );

  // Memoize calculated stats for optimal performance
  const stats = useMemo(() => {
    if (!address || isLoading) {
      return {
        owned: 0,
        created: 0,
        sold: 0,
        totalVolume: 0,
        activeListings: 0,
        activeAuctions: 0,
        totalEarnings: 0,
      };
    }

    try {
      const {
        ownedNFTs: normalizedOwnedNFTs,
        createdNFTs: normalizedCreatedNFTs,
        userListings: normalizedUserListings,
        userAuctions: normalizedUserAuctions,
      } = normalizedData;

      // Count owned NFTs
      const owned = normalizedOwnedNFTs.length;

      // Count created NFTs
      const created = normalizedCreatedNFTs.length;

      // Count active listings (check both active and isActive properties for compatibility)
      const activeListings = normalizedUserListings.filter(
        (listing) => listing.active || listing.isActive
      ).length;

      // Count active auctions (check status and active properties)
      const now = Date.now();
      const activeAuctions = normalizedUserAuctions.filter(
        (auction) =>
          (auction.status === "active" || auction.active) &&
          auction.endTime > now
      ).length;

      // Calculate total volume from listings (sum of completed sales)
      const totalVolume = normalizedUserListings
        .filter((listing) => !listing.active && !listing.isActive) // Sold listings
        .reduce((sum, listing) => {
          const price = listing.priceWei || listing.price || 0n;
          return sum + Number(price);
        }, 0);

      // Calculate total earnings (same as volume for now)
      const totalEarnings = totalVolume;

      // Count sold NFTs (listings that are no longer active)
      const sold = normalizedUserListings.filter(
        (listing) => !listing.active && !listing.isActive
      ).length;

      return {
        owned,
        created,
        sold,
        totalVolume,
        activeListings,
        activeAuctions,
        totalEarnings,
      };
    } catch (error) {
      console.error("Error calculating user stats:", error);
      return {
        owned: 0,
        created: 0,
        sold: 0,
        totalVolume: 0,
        activeListings: 0,
        activeAuctions: 0,
        totalEarnings: 0,
      };
    }
  }, [address, normalizedData, isLoading]);

  // Return memoized data for optimal performance
  return useMemo(
    () => ({
      stats,
      ownedNFTs: normalizedData.ownedNFTs,
      createdNFTs: normalizedData.createdNFTs,
      userListings: normalizedData.userListings,
      userAuctions: normalizedData.userAuctions,
      isLoading,
    }),
    [stats, normalizedData, isLoading]
  );
}
