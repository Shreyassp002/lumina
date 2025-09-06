'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LUMINA_AUCTION_ABI, LUMINA_AUCTION_ADDRESS } from '../../abi/luminaAuction';
import { formatEther, parseEther } from 'viem';
import Link from 'next/link';
import { Clock, Gavel, Zap, ExternalLink } from 'lucide-react';

export default function AuctionCard({ auction, currentUser }) {
  const { address } = useAccount();
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

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
      await writeContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: 'placeBid',
        args: [auction.id],
        value: bidValue,
      });
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
      await writeContract({
        address: LUMINA_AUCTION_ADDRESS,
        abi: LUMINA_AUCTION_ABI,
        functionName: 'buyNow',
        args: [auction.id],
        value: auction.buyNowPrice,
      });
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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden">
        <img
          src={`https://picsum.photos/400/400?random=${auction.tokenId}`}
          alt={`NFT #${auction.tokenId}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isActive 
              ? 'bg-green-500 text-white' 
              : isEnded 
                ? 'bg-gray-500 text-white'
                : 'bg-blue-500 text-white'
          }`}>
            {isActive ? 'Live' : isEnded ? 'Ended' : 'Upcoming'}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <Link
            href={`/nft/${auction.tokenId}`}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              NFT #{auction.tokenId}
            </h3>
            <p className="text-sm text-gray-600">
              by {auction.seller ? `${auction.seller.slice(0, 6)}...${auction.seller.slice(-4)}` : 'Unknown'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Bids</div>
            <div className="font-semibold text-gray-900">{auction.bidCount}</div>
          </div>
        </div>

        {/* Current Bid */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Current Bid</span>
            <span className="text-sm text-gray-600">Min. Increment</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-gray-900">
              {formatEther(auction.currentBid || auction.startPrice)} ETH
            </div>
            <div className="text-sm text-gray-600">
              {formatEther(auction.minIncrement)} ETH
            </div>
          </div>
          {auction.currentBidder && (
            <div className="text-sm text-gray-500 mt-1">
              by {auction.currentBidder.slice(0, 6)}...{auction.currentBidder.slice(-4)}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
          <Clock className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">
            {isEnded ? 'Auction Ended' : `Ends in ${timeLeft}`}
          </span>
        </div>

        {/* Buy Now Price */}
        {auction.buyNowPrice && isActive && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 font-medium">Buy Now Price</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatEther(auction.buyNowPrice)} ETH
                </div>
              </div>
              {!isOwner && (
                <button
                  onClick={handleBuyNow}
                  disabled={isBuyingNow || isConfirming}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isBuyingNow || isConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isConfirming ? 'Confirming...' : 'Buying...'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Bid (ETH)
              </label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Min: ${formatEther(parseEther(formatEther(auction.currentBid || auction.startPrice)) + parseEther(formatEther(auction.minIncrement)))}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleBid}
              disabled={isBidding || isConfirming || !bidAmount || isCurrentBidder}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isBidding || isConfirming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isConfirming ? 'Confirming...' : 'Placing Bid...'}
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
          <div className="p-3 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-600">This is your auction</p>
          </div>
        )}

        {isEnded && (
          <div className="p-3 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              {auction.currentBidder ? 'Auction completed' : 'No bids received'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
