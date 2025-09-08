'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { LUMINA_MARKETPLACE_ABI, LUMINA_MARKETPLACE_ADDRESS } from '../../abi/luminaMarketplace';
import { useState, useEffect } from 'react';

// Hook to get active listings
export function useActiveListings(offset = 0, limit = 20) {
  const [listings, setListings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const result = await publicClient.readContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: 'getActiveListings',
        args: [offset, limit],
      });
      setListings(result);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [offset, limit, publicClient]);

  const refetch = () => {
    fetchListings();
  };

  return {
    listings,
    isLoading,
    refetch,
  };
}

// Hook to get user's listings
export function useUserListings(address) {
  const [userListings, setUserListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchUserListings = async () => {
      setIsLoading(true);
      try {
        // Get all active listings and filter by user
        const { data: allListings } = await fetch('/api/contracts/getActiveListings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: LUMINA_MARKETPLACE_ADDRESS,
            offset: 0,
            limit: 1000 // Get all listings
          }),
        });

        if (allListings) {
          const [listingData, tokenIds] = allListings;
          const userListings = listingData
            .map((listing, index) => ({
              ...listing,
              tokenId: tokenIds[index],
              listingId: index
            }))
            .filter(listing => listing.seller.toLowerCase() === address.toLowerCase());

          setUserListings(userListings);
        }
      } catch (error) {
        console.error('Error fetching user listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserListings();

    // Auto refresh on marketplace updates
    const onUpdated = () => fetchUserListings();
    try { window.addEventListener('marketplace:updated', onUpdated); } catch { }
    return () => { try { window.removeEventListener('marketplace:updated', onUpdated); } catch { } };
  }, [address]);

  return {
    listings: userListings,
    isLoading,
    // internal refetch (optional)
    refetch: () => {
      try { window.dispatchEvent(new CustomEvent('marketplace:force-refetch')); } catch { }
    }
  };
}

// Hook to list NFT for sale
export function useListNFT() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      try { window.dispatchEvent(new CustomEvent('marketplace:updated')); } catch { }
    }
  }, [isConfirmed]);

  const listNFT = async (tokenId, price) => {
    try {
      await writeContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: 'listItem',
        args: [tokenId, price],
      });
    } catch (error) {
      console.error('Listing failed:', error);
      throw error;
    }
  };

  return {
    listNFT,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to buy NFT
export function useBuyNFT() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      try { window.dispatchEvent(new CustomEvent('marketplace:updated')); } catch { }
    }
  }, [isConfirmed]);

  const buyNFT = async (listingId, price) => {
    try {
      await writeContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: 'buyItem',
        args: [listingId],
        value: price,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  };

  return {
    buyNFT,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to cancel listing
export function useCancelListing() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      try { window.dispatchEvent(new CustomEvent('marketplace:updated')); } catch { }
    }
  }, [isConfirmed]);

  const cancelListing = async (listingId) => {
    try {
      await writeContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: 'cancelListing',
        args: [listingId],
      });
    } catch (error) {
      console.error('Cancel listing failed:', error);
      throw error;
    }
  };

  return {
    cancelListing,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to update listing price
export function useUpdateListing() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      try { window.dispatchEvent(new CustomEvent('marketplace:updated')); } catch { }
    }
  }, [isConfirmed]);

  const updateListing = async (listingId, newPrice) => {
    try {
      await writeContract({
        address: LUMINA_MARKETPLACE_ADDRESS,
        abi: LUMINA_MARKETPLACE_ABI,
        functionName: 'updateListing',
        args: [listingId, newPrice],
      });
    } catch (error) {
      console.error('Update listing failed:', error);
      throw error;
    }
  };

  return {
    updateListing,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to get platform statistics
export function usePlatformStats() {
  const { data: totalVolume } = useReadContract({
    address: LUMINA_MARKETPLACE_ADDRESS,
    abi: LUMINA_MARKETPLACE_ABI,
    functionName: 'totalVolume',
  });

  const { data: totalSales } = useReadContract({
    address: LUMINA_MARKETPLACE_ADDRESS,
    abi: LUMINA_MARKETPLACE_ABI,
    functionName: 'totalSales',
  });

  const { data: activeListings } = useReadContract({
    address: LUMINA_MARKETPLACE_ADDRESS,
    abi: LUMINA_MARKETPLACE_ABI,
    functionName: 'getActiveListingsCount',
  });

  return {
    totalVolume,
    totalSales,
    activeListings,
    isLoading: !totalVolume || !totalSales || !activeListings,
  };
}
