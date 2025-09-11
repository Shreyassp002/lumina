"use client";

import { useState, useMemo } from "react";
import { useBatchNFTData, useUserNFTs } from "../../hooks/useNFT";
import { NFTImage } from "../common/ProgressiveImage";
import { queryKeyFactory } from "../../lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
// Performance monitoring removed

/**
 * Advanced NFT Grid Component
 * Demonstrates the use of NFT hooks with intelligent caching
 */
export function NFTGridAdvanced({
  tokenIds = [],
  userAddress = null,
  showUserNFTs = false,
  className = "",
  itemClassName = "",
  onNFTClick = () => {},
}) {
  const [selectedNFT, setSelectedNFT] = useState(null);
  const queryClient = useQueryClient();

  // Performance monitoring removed

  // Use batch fetching for specific token IDs
  const {
    data: batchNFTs = [],
    isLoading: isBatchLoading,
    error: batchError,
  } = useBatchNFTData(tokenIds, {
    enabled: tokenIds.length > 0 && !showUserNFTs,
    includeMetadata: true,
    batchSize: 10,
  });

  // Use user NFTs hook when showing user's collection
  const {
    data: userNFTs = [],
    isLoading: isUserLoading,
    error: userError,
  } = useUserNFTs(userAddress, {
    enabled: showUserNFTs && !!userAddress,
    includeMetadata: true,
  });

  // Determine which data to display
  const nfts = showUserNFTs ? userNFTs : batchNFTs;
  const isLoading = showUserNFTs ? isUserLoading : isBatchLoading;
  const error = showUserNFTs ? userError : batchError;

  // Memoized NFT items for performance
  const nftItems = useMemo(() => {
    return nfts.map((nft) => (
      <NFTGridItem
        key={nft.tokenId}
        nft={nft}
        className={itemClassName}
        onClick={() => {
          setSelectedNFT(nft);
          onNFTClick(nft);
        }}
        isSelected={selectedNFT?.tokenId === nft.tokenId}
      />
    ));
  }, [nfts, itemClassName, onNFTClick, selectedNFT]);

  // Prefetch related data on hover
  const handleNFTHover = (nft) => {
    // Prefetch creator profile if not already cached
    if (nft.creator) {
      queryClient.prefetchQuery({
        queryKey: queryKeyFactory.nfts.creatorProfile(nft.creator),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  };

  if (isLoading) {
    return <NFTGridSkeleton className={className} />;
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-red-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-semibold">Failed to load NFTs</p>
          <p className="text-sm text-gray-600 mt-1">{error.message}</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-lg font-medium">No NFTs found</p>
        <p className="text-sm mt-1">
          {showUserNFTs
            ? "This user doesn't own any NFTs yet."
            : "No NFTs available in this collection."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}
    >
      {nftItems}
    </div>
  );
}

/**
 * Individual NFT Grid Item Component
 */
function NFTGridItem({ nft, className = "", onClick, isSelected = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
        relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:scale-105
        ${isSelected ? "ring-2 ring-blue-500" : ""}
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* NFT Image */}
      <div className="aspect-square relative">
        <NFTImage
          imageUrl={nft.imageUrl}
          tokenId={nft.tokenId}
          alt={nft.name}
          size="full"
          className="w-full h-full"
        />

        {/* Hover overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="bg-white bg-opacity-90 rounded-full p-2">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate mb-1">
          {nft.name || `NFT #${nft.tokenId}`}
        </h3>

        {nft.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
            {nft.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>#{nft.tokenId}</span>
          {nft.creator && (
            <span className="truncate ml-2">
              by {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
            </span>
          )}
        </div>

        {/* Attributes preview */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {nft.attributes.slice(0, 2).map((attr, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {attr.trait_type}: {attr.value}
              </span>
            ))}
            {nft.attributes.length > 2 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{nft.attributes.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for NFT grid
 */
function NFTGridSkeleton({ className = "" }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${className}`}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-gray-200"></div>
          <div className="p-4">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NFTGridAdvanced;
