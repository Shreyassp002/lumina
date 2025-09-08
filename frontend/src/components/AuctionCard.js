'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePlaceBid, useBuyNow } from '../hooks/useAuction';
import { useNFTData } from '../hooks/useNFT';
import { formatEther, parseEther } from 'viem';
import Link from 'next/link';
import { Clock, Gavel, Zap, ExternalLink } from 'lucide-react';

export default function AuctionCard({ auction, currentUser }) {
  const { address } = useAccount();
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [name, setName] = useState(null);

  const { placeBid, isConfirming: isBidConfirming } = usePlaceBid();
  const { buyNow, isConfirming: isBuyConfirming } = useBuyNow();
  const { tokenURI } = useNFTData(auction.tokenId);

  const resolveIpfs = (uri) => {
    if (!uri) return null;
    if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
    return uri;
  };

  useEffect(() => {
    const loadMd = async () => {
      try {
        const httpUri = resolveIpfs(tokenURI);
        if (!httpUri) return;
        const res = await fetch(httpUri);
        if (!res.ok) return;
        const json = await res.json();
        setMetadata(json);
        setName(json?.name || null);
        setImageUrl(resolveIpfs(json?.image));
      } catch (_) { }
    };
    loadMd();
  }, [tokenURI]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const timeDiff = auction.endTime - now;

      if (timeDiff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime]);

  const handleBid = async () => {
    if (!address || !bidAmount) return;

    const bidValue = parseEther(bidAmount);
    const minBid = parseEther(formatEther(auction.currentBid || auction.startPrice)) + parseEther(formatEther(auction.minIncrement));

    if (bidValue < minBid) {
      alert(`Minimum bid is ${formatEther(minBid)} ETH`);
      return;
    }

    setIsBidding(true);
    try {
      await placeBid(auction.id, bidValue);
    } catch (error) {
      console.error('Bid failed:', error);
      alert('Bid failed. Please try again.');
    } finally {
      setIsBidding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!address || !auction.buyNowPrice) return;

    setIsBuyingNow(true);
    try {
      await buyNow(auction.id, auction.buyNowPrice);
    } catch (error) {
      console.error('Buy now failed:', error);
      alert('Buy now failed. Please try again.');
    } finally {
      setIsBuyingNow(false);
    }
  };

  const isOwner = currentUser?.toLowerCase() === auction.seller?.toLowerCase();
  const isCurrentBidder = currentUser?.toLowerCase() === auction.currentBidder?.toLowerCase();
  const isEnded = auction.endTime <= Date.now();
  const isActive = auction.status === 'active' && !isEnded;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden hover:neon-glow transition-shadow duration-300">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name || `NFT #${auction.tokenId}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#0e1518] flex items-center justify-center text-green-200/60">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive
            ? 'bg-emerald-500 text-black'
            : isEnded
              ? 'bg-[#0e1518] text-green-200/70'
              : 'bg-lime-500 text-black'
            }`}>
            {isActive ? 'Live' : isEnded ? 'Ended' : 'Upcoming'}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <Link
            href={`/nft/${auction.tokenId}`}
            className="p-2 bg-[#0e1518]/80 backdrop-blur-sm rounded-full hover:bg-[#0e1518] transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-emerald-200" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-emerald-200 text-lg">
              {name || `NFT #${auction.tokenId}`}
            </h3>
            <p className="text-sm text-green-200/70">
              by {auction.seller ? `${auction.seller.slice(0, 6)}...${auction.seller.slice(-4)}` : 'Unknown'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-200/70">Bids</div>
            <div className="font-semibold text-emerald-300">{auction.bidCount}</div>
          </div>
        </div>

        {/* Current Bid */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-200/70">Current Bid</span>
            <span className="text-sm text-green-200/70">Min. Increment</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-emerald-300">
              {formatEther(auction.currentBid || auction.startPrice)} ETH
            </div>
            <div className="text-sm text-green-200/70">
              {formatEther(auction.minIncrement)} ETH
            </div>
          </div>
          {auction.currentBidder && (
            <div className="text-sm text-green-200/60 mt-1">
              by {auction.currentBidder.slice(0, 6)}...{auction.currentBidder.slice(-4)}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center mb-4 p-3 bg-[#0e1518] rounded-lg">
          <Clock className="w-4 h-4 text-green-200/70 mr-2" />
          <span className="text-sm font-medium text-emerald-200">
            {isEnded ? 'Auction Ended' : `Ends in ${timeLeft}`}
          </span>
        </div>

        {/* Buy Now Price */}
        {auction.buyNowPrice && isActive && (
          <div className="mb-4 p-3 bg-[#0e1518] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-emerald-300 font-medium">Buy Now Price</div>
                <div className="text-lg font-bold text-emerald-300">
                  {formatEther(auction.buyNowPrice)} ETH
                </div>
              </div>
              {!isOwner && (
                <button
                  onClick={handleBuyNow}
                  disabled={isBuyingNow || isBuyConfirming}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-lime-500 text-black text-sm font-semibold rounded-lg hover:from-emerald-400 hover:to-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center neon-glow"
                >
                  {isBuyingNow || isBuyConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isBuyConfirming ? 'Confirming...' : 'Buying...'}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-1" />
                      Buy Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bid Section */}
        {isActive && !isOwner && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-green-200/80 mb-1">
                Your Bid (ETH)
              </label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Min: ${formatEther(parseEther(formatEther(auction.currentBid || auction.startPrice)) + parseEther(formatEther(auction.minIncrement)))}`}
                className="w-full px-3 py-2 glass-panel rounded-lg focus:outline-none"
              />
            </div>
            <button
              onClick={handleBid}
              disabled={isBidding || isBidConfirming || !bidAmount || isCurrentBidder}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-semibold rounded-lg hover:from-emerald-400 hover:to-lime-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center neon-glow"
            >
              {isBidding || isBidConfirming ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isBidConfirming ? 'Confirming...' : 'Placing Bid...'}
                </>
              ) : isCurrentBidder ? (
                'You are the highest bidder'
              ) : (
                <>
                  <Gavel className="w-5 h-5 mr-2" />
                  Place Bid
                </>
              )}
            </button>
          </div>
        )}

        {isOwner && (
          <div className="p-3 bg-[#0e1518] rounded-lg text-center">
            <p className="text-sm text-green-200/70">This is your auction</p>
          </div>
        )}

        {isEnded && (
          <div className="p-3 bg-[#0e1518] rounded-lg text-center">
            <p className="text-sm text-green-200/70">
              {auction.currentBidder ? 'Auction completed' : 'No bids received'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
