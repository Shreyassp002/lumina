'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
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
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      setUserNFTs([]);
      return;
    }

    const fetchUserNFTs = async () => {
      setIsLoading(true);
      try {
        // Read the current token counter from contract
        const currentTokenId = await publicClient.readContract({
          address: LUMINA_NFT_ADDRESS,
          abi: LUMINA_NFT_ABI,
          functionName: 'getCurrentTokenId',
          args: [],
        });

        if (!currentTokenId || Number(currentTokenId) === 0) {
          setUserNFTs([]);
          return;
        }

        const tokenIds = Array.from({ length: Number(currentTokenId) }, (_, idx) => idx + 1);

        const owners = await Promise.all(
          tokenIds.map((id) =>
            publicClient
              .readContract({ address: LUMINA_NFT_ADDRESS, abi: LUMINA_NFT_ABI, functionName: 'ownerOf', args: [id] })
              .catch(() => null)
          )
        );

        const ownedIds = tokenIds.filter((id, i) => owners[i] && owners[i].toLowerCase() === address.toLowerCase());

        const [tokenDatas, tokenUris] = await Promise.all([
          Promise.all(
            ownedIds.map((id) =>
              publicClient
                .readContract({ address: LUMINA_NFT_ADDRESS, abi: LUMINA_NFT_ABI, functionName: 'tokenData', args: [id] })
                .catch(() => null)
            )
          ),
          Promise.all(
            ownedIds.map((id) =>
              publicClient
                .readContract({ address: LUMINA_NFT_ADDRESS, abi: LUMINA_NFT_ABI, functionName: 'tokenURI', args: [id] })
                .catch(() => null)
            )
          ),
        ]);

        const resolveIpfs = (uri) => {
          if (!uri) return null;
          if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
          return uri;
        };

        const metadataJsons = await Promise.all(
          tokenUris.map(async (uri) => {
            try {
              const httpUri = resolveIpfs(uri);
              if (!httpUri) return null;
              const res = await fetch(httpUri);
              if (!res.ok) return null;
              return await res.json();
            } catch {
              return null;
            }
          })
        );

        const nfts = ownedIds.map((id, index) => {
          const md = metadataJsons[index];
          const imageUrl = md?.image ? resolveIpfs(md.image) : null;
          return { tokenId: id, owner: address, tokenData: tokenDatas[index], tokenURI: tokenUris[index], imageUrl, metadata: md };
        });
        setUserNFTs(nfts);
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserNFTs();
  }, [address, publicClient]);

  return {
    nfts: userNFTs,
    balance,
    isLoading,
  };
}

// Hook to get user's created NFTs
export function useUserCreatedNFTs(address) {
  const [createdNFTs, setCreatedNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      setCreatedNFTs([]);
      return;
    }

    const fetchCreated = async () => {
      setIsLoading(true);
      try {
        const currentTokenId = await publicClient.readContract({
          address: LUMINA_NFT_ADDRESS,
          abi: LUMINA_NFT_ABI,
          functionName: 'getCurrentTokenId',
          args: [],
        });

        if (!currentTokenId || Number(currentTokenId) === 0) {
          setCreatedNFTs([]);
          return;
        }

        const tokenIds = Array.from({ length: Number(currentTokenId) }, (_, idx) => idx + 1);

        const [tokenDatas, tokenUris] = await Promise.all([
          Promise.all(
            tokenIds.map((id) =>
              publicClient
                .readContract({ address: LUMINA_NFT_ADDRESS, abi: LUMINA_NFT_ABI, functionName: 'tokenData', args: [id] })
                .catch(() => null)
            )
          ),
          Promise.all(
            tokenIds.map((id) =>
              publicClient
                .readContract({ address: LUMINA_NFT_ADDRESS, abi: LUMINA_NFT_ABI, functionName: 'tokenURI', args: [id] })
                .catch(() => null)
            )
          ),
        ]);

        const created = tokenIds
          .map((id, i) => ({ id, data: tokenDatas[i], uri: tokenUris[i] }))
          .filter((x) => x.data && x.data.creator && x.data.creator.toLowerCase() === address.toLowerCase());

        const resolveIpfs = (uri) => {
          if (!uri) return null;
          if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
          return uri;
        };

        const metadataJsons = await Promise.all(
          created.map(async (x) => {
            try {
              const httpUri = resolveIpfs(x.uri);
              if (!httpUri) return null;
              const res = await fetch(httpUri);
              if (!res.ok) return null;
              return await res.json();
            } catch {
              return null;
            }
          })
        );

        const nfts = created.map((x, idx) => {
          const md = metadataJsons[idx];
          const imageUrl = md?.image ? resolveIpfs(md.image) : null;
          return { tokenId: x.id, owner: null, tokenData: x.data, tokenURI: x.uri, imageUrl, metadata: md };
        });
        setCreatedNFTs(nfts);
      } catch (error) {
        console.error('Error fetching created NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreated();
  }, [address, publicClient]);

  return {
    nfts: createdNFTs,
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
