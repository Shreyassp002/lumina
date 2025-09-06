'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LUMINA_NFT_ABI, LUMINA_NFT_ADDRESS } from '../../abi/luminaNft';
import { useState, useEffect } from 'react';

// Hook to get user's NFT balance
export function useUserNFTBalance(address) {
  return useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Hook to get NFT token data
export function useNFTData(tokenId) {
  const { data: tokenURI } = useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: 'tokenURI',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  const { data: tokenData } = useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: 'tokenData',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  const { data: owner } = useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: 'ownerOf',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  return {
    tokenURI,
    tokenData,
    owner,
    isLoading: !tokenURI || !tokenData || !owner,
  };
}

// Hook to get user's owned NFTs
export function useUserNFTs(address) {
  const { data: balance, isLoading: balanceLoading } = useUserNFTBalance(address);
  const [userNFTs, setUserNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address || balanceLoading || !balance) {
      setIsLoading(balanceLoading);
      return;
    }

    const fetchUserNFTs = async () => {
      setIsLoading(true);
      try {
        // Get total supply to iterate through all tokens
        const { data: totalSupply } = await fetch('/api/contracts/totalSupply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractAddress: LUMINA_NFT_ADDRESS }),
        });

        if (totalSupply) {
          const nfts = [];
          for (let i = 1; i <= totalSupply; i++) {
            try {
              const { data: owner } = await fetch('/api/contracts/ownerOf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  contractAddress: LUMINA_NFT_ADDRESS,
                  tokenId: i 
                }),
              });

              if (owner?.toLowerCase() === address.toLowerCase()) {
                const { data: tokenData } = await fetch('/api/contracts/tokenData', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    contractAddress: LUMINA_NFT_ADDRESS,
                    tokenId: i 
                  }),
                });

                nfts.push({
                  tokenId: i,
                  owner,
                  tokenData,
                });
              }
            } catch (error) {
              console.error(`Error fetching token ${i}:`, error);
            }
          }
          setUserNFTs(nfts);
        }
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserNFTs();
  }, [address, balance, balanceLoading]);

  return {
    nfts: userNFTs,
    balance,
    isLoading,
  };
}

// Hook to mint NFT
export function useMintNFT() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const mintNFT = async (metadataURI, royaltyBps, category) => {
    try {
      await writeContract({
        address: LUMINA_NFT_ADDRESS,
        abi: LUMINA_NFT_ABI,
        functionName: 'mintNFT',
        args: [metadataURI, royaltyBps, category],
        value: 1000000000000000n, // 0.001 ETH mint fee
      });
    } catch (error) {
      console.error('Minting failed:', error);
      throw error;
    }
  };

  return {
    mintNFT,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}

// Hook to get creator profile
export function useCreatorProfile(address) {
  return useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: 'creatorProfiles',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Hook to update creator profile
export function useUpdateCreatorProfile() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const updateProfile = async (name, bio, socialLink) => {
    try {
      await writeContract({
        address: LUMINA_NFT_ADDRESS,
        abi: LUMINA_NFT_ABI,
        functionName: 'updateCreatorProfile',
        args: [name, bio, socialLink],
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  return {
    updateProfile,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
  };
}
