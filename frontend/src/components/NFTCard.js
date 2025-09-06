'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LUMINA_NFT_ABI, LUMINA_NFT_ADDRESS } from '../../abi/luminaNft';
import { LUMINA_MARKETPLACE_ABI, LUMINA_MARKETPLACE_ADDRESS } from '../../abi/luminaMarketplace';
import { formatEther } from 'viem';
import Link from 'next/link';
import { Heart, ShoppingCart, ExternalLink } from 'lucide-react';

export default function NFTCard({ tokenId, price, seller, listingId }) {
  const { address } = useAccount();
  const [nftData, setNftData] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Fetch NFT metadata
  const { data: tokenURI } = useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  // Fetch token data
  const { data: tokenData } = useReadContract({
    address: LUMINA_NFT_ADDRESS,
    abi: LUMINA_NFT_ABI,
    functionName: 'tokenData',
    args: [tokenId],
  });

  // Purchase function
  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (tokenURI) {
      // In a real app, you would fetch the metadata from IPFS
      // For now, we'll use placeholder data
      setNftData({
        name: `NFT #${tokenId}`,
        description: 'A unique digital collectible',
        image: `https://picsum.photos/400/400?random=${tokenId}`,
        attributes: [
          { trait_type: 'Rarity', value: 'Common' },
          { trait_type: 'Category', value: 'Art' }
        ]
      });
    }
  }, [tokenURI, tokenId]);

  const handlePurchase = async () => {
    if (!address) return;
    
    setIsPurchasing(true);
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
    } finally {
      setIsPurchasing(false);
    }
  };

  const isOwner = address?.toLowerCase() === seller?.toLowerCase();

  if (!nftData) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-200"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        <img
          src={nftData.image}
          alt={nftData.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
        {tokenData?.isVerifiedCreator && (
          <div className="absolute top-3 left-3">
            <div className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
              Verified
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate flex-1">
            {nftData.name}
          </h3>
          <Link
            href={`/nft/${tokenId}`}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {nftData.description}
        </p>

        {/* Creator */}
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600 truncate">
            {tokenData?.creator ? `${tokenData.creator.slice(0, 6)}...${tokenData.creator.slice(-4)}` : 'Unknown'}
          </span>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {formatEther(price)} ETH
            </div>
            {tokenData?.royaltyBps && (
              <div className="text-xs text-gray-500">
                {tokenData.royaltyBps / 100}% royalty
              </div>
            )}
          </div>

          {!isOwner && (
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || isConfirming}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isPurchasing || isConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isConfirming ? 'Confirming...' : 'Purchasing...'}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Buy
                </>
              )}
            </button>
          )}

          {isOwner && (
            <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg">
              Your NFT
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
