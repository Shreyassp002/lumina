"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useAccount } from "wagmi";
import { useNFTData } from "../../hooks/useNFT";
import { useBuyNFT } from "../../hooks/useMarketplace";
import { formatEther } from "viem";
import Link from "next/link";
import { Heart, ShoppingCart, ExternalLink } from "lucide-react";

export default function NFTCard({
  tokenId,
  price,
  seller,
  listingId,
  isOptimistic = false,
  refCallback,
  onCardClick,
}) {
  const { address } = useAccount();
  const [isLiked, setIsLiked] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [name, setName] = useState(null);
  const rootRef = useRef(null);

  // Use hook for contract interactions
  const {
    data: nftData,
    isLoading: nftLoading,
    error: nftError,
  } = useNFTData(tokenId, { includeMetadata: true });
  const {
    buyNFT,
    isPending: isPurchasing,
    isConfirming,
    isConfirmed,
  } = useBuyNFT();

  // Resolve ipfs:// to https
  const resolveIpfs = (uri) => {
    if (!uri) return null;
    if (uri.startsWith("ipfs://"))
      return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    return uri;
  };

  // Extract data from hook response
  useEffect(() => {
    if (nftData) {
      setMetadata(nftData.metadata);
      setName(nftData.name || nftData.metadata?.name || null);
      setImageUrl(nftData.imageUrl || resolveIpfs(nftData.metadata?.image));
    }
  }, [nftData]);

  const handlePurchase = async () => {
    if (!address) return;

    try {
      await buyNFT(listingId, price, address);
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  };

  const isOwner = address?.toLowerCase() === seller?.toLowerCase();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // Provide element to parent for list-level stagger
    if (typeof refCallback === "function") refCallback(el);
  }, [refCallback]);

  if (nftLoading) {
    return (
      <div className="glass-panel rounded-2xl overflow-hidden animate-pulse">
        <div className="aspect-square bg-[#0e1518]"></div>
        <div className="p-4">
          <div className="h-4 bg-[#0e1518] rounded mb-2"></div>
          <div className="h-4 bg-[#0e1518] rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const handleCardClick = (e) => {
    // Don't trigger modal if clicking on interactive elements
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    if (onCardClick) {
      onCardClick(tokenId, nftData);
    }
  };

  return (
    <div
      ref={rootRef}
      onClick={handleCardClick}
      className={`glass-panel rounded-2xl overflow-hidden hover:neon-glow transition-shadow duration-300 group cursor-pointer ${
        isOptimistic ? "opacity-75 border border-emerald-400/50" : ""
      }`}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name || `NFT #${tokenId}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-[#0e1518] flex items-center justify-center text-green-200/60">
            No image
          </div>
        )}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer ${
              isLiked
                ? "bg-emerald-500 text-black"
                : "bg-[#0e1518]/80 text-emerald-200 hover:bg-[#0e1518]"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </button>
        </div>
        {nftData?.tokenData?.isVerifiedCreator && (
          <div className="absolute top-3 left-3">
            <div className="px-2 py-1 bg-emerald-500 text-black text-xs font-semibold rounded-full">
              Verified
            </div>
          </div>
        )}
        {isOptimistic && (
          <div className="absolute bottom-3 left-3">
            <div className="px-2 py-1 bg-yellow-500/80 text-black text-xs font-semibold rounded-full">
              Pending
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-emerald-200 truncate flex-1">
            {name || `NFT #${tokenId}`}
          </h3>
          <Link
            href={`/nft/${tokenId}`}
            className="ml-2 p-1 text-green-200/70 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-sm text-green-200/70 mb-3 line-clamp-2">
          {metadata?.category || nftData?.tokenData?.category || "Digital Art"}
        </p>

        {/* Creator */}
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full mr-2"></div>
          <span className="text-sm text-green-200/70 truncate">
            {nftData?.tokenData?.creator
              ? `${nftData.tokenData.creator.slice(
                  0,
                  6
                )}...${nftData.tokenData.creator.slice(-4)}`
              : "Unknown"}
          </span>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-emerald-300">
              {formatEther(price)} STT
            </div>
            {nftData?.tokenData?.royaltyBps && (
              <div className="text-xs text-green-200/60">
                {nftData.tokenData.royaltyBps / 100}% royalty
              </div>
            )}
          </div>

          {!isOwner && (
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || isConfirming}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-lime-500 text-black text-sm font-semibold rounded-lg hover:from-emerald-400 hover:to-lime-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center neon-glow cursor-pointer"
            >
              {isPurchasing || isConfirming ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isConfirming ? "Confirming..." : "Purchasing..."}
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
            <div className="px-4 py-2 bg-[#0e1518] text-emerald-200 text-sm font-semibold rounded-lg">
              Your NFT
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
