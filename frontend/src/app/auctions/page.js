'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { LUMINA_AUCTION_ABI, LUMINA_AUCTION_ADDRESS } from '../../../abi/luminaAuction';
import Layout from '../../components/Layout';
import AuctionCard from '../../components/AuctionCard';
import { Gavel, Clock, TrendingUp } from 'lucide-react';

export default function AuctionsPage() {
  const { address } = useAccount();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, ending-soon, ended

  // Fetch auctions from the contract
  const { data: auctionCount } = useReadContract({
    address: LUMINA_AUCTION_ADDRESS,
    abi: LUMINA_AUCTION_ABI,
    functionName: 'getAuctionCount',
  });

  useEffect(() => {
    if (auctionCount) {
      // In a real app, you would fetch auction data from the contract
      // For now, we'll use mock data
      const mockAuctions = [
        {
          id: 1,
          tokenId: 1,
          seller: '0x1234...5678',
          startPrice: '1000000000000000000', // 1 ETH
          currentBid: '1500000000000000000', // 1.5 ETH
          currentBidder: '0x8765...4321',
          endTime: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
          minIncrement: '100000000000000000', // 0.1 ETH
          buyNowPrice: '5000000000000000000', // 5 ETH
          status: 'active',
          bidCount: 3
        },
        {
          id: 2,
          tokenId: 2,
          seller: '0x1111...2222',
          startPrice: '2000000000000000000', // 2 ETH
          currentBid: '2000000000000000000', // 2 ETH
          currentBidder: null,
          endTime: Date.now() + 30 * 60 * 1000, // 30 minutes from now
          minIncrement: '200000000000000000', // 0.2 ETH
          buyNowPrice: null,
          status: 'active',
          bidCount: 0
        },
        {
          id: 3,
          tokenId: 3,
          seller: '0x3333...4444',
          startPrice: '500000000000000000', // 0.5 ETH
          currentBid: '800000000000000000', // 0.8 ETH
          currentBidder: '0x5555...6666',
          endTime: Date.now() - 60 * 60 * 1000, // 1 hour ago
          minIncrement: '50000000000000000', // 0.05 ETH
          buyNowPrice: null,
          status: 'ended',
          bidCount: 5
        }
      ];
      
      setAuctions(mockAuctions);
      setLoading(false);
    }
  }, [auctionCount]);

  const filteredAuctions = auctions.filter(auction => {
    const now = Date.now();
    const timeLeft = auction.endTime - now;
    
    switch (filter) {
      case 'active':
        return auction.status === 'active' && timeLeft > 0;
      case 'ending-soon':
        return auction.status === 'active' && timeLeft > 0 && timeLeft < 60 * 60 * 1000; // Less than 1 hour
      case 'ended':
        return auction.status === 'ended' || timeLeft <= 0;
      default:
        return true;
    }
  });

  const activeAuctions = auctions.filter(a => a.status === 'active' && a.endTime > Date.now()).length;
  const totalVolume = auctions.reduce((sum, a) => sum + parseFloat(a.currentBid || a.startPrice), 0);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading auctions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                NFT Auctions
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Bid on unique NFTs and discover rare digital collectibles through our auction system
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{activeAuctions}</div>
                  <div className="text-gray-600">Active Auctions</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {auctions.filter(a => a.status === 'active' && a.endTime - Date.now() < 60 * 60 * 1000).length}
                  </div>
                  <div className="text-gray-600">Ending Soon</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalVolume.toFixed(2)} ETH
                  </div>
                  <div className="text-gray-600">Total Volume</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
            {[
              { key: 'all', label: 'All Auctions' },
              { key: 'active', label: 'Active' },
              { key: 'ending-soon', label: 'Ending Soon' },
              { key: 'ended', label: 'Ended' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Auction Grid */}
          {filteredAuctions.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No auctions are currently available'
                  : `No ${filter.replace('-', ' ')} auctions found`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  currentUser={address}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
