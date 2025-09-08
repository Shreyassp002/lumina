'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Layout from '../../components/Layout';
import { useUserStats } from '../../hooks/useUserStats';
import { useCreatorProfile } from '../../hooks/useNFT';
import { useListNFT } from '../../hooks/useMarketplace';
import { useCreateAuction } from '../../hooks/useAuction';
import NFTActionModal from '../../components/NFTActionModal';
import { User, Package, Heart, TrendingUp, Settings, Edit3, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('owned');

  // Use custom hooks to get real contract data
  const { stats, ownedNFTs, createdNFTs, userListings, userAuctions, isLoading } = useUserStats(address);
  const { data: creatorProfile, isLoading: profileLoading } = useCreatorProfile(address);
  const { listNFT, isPending: isListing } = useListNFT();
  const { createAuction, isPending: isCreatingAuction } = useCreateAuction();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [modalAction, setModalAction] = useState('list');

  const tabs = [
    { key: 'owned', label: 'Owned', icon: Package },
    { key: 'created', label: 'Created', icon: User },
    { key: 'favorites', label: 'Favorites', icon: Heart },
    { key: 'activity', label: 'Activity', icon: TrendingUp },
  ];

  const handleOpenModal = (nft, action) => {
    setSelectedNFT(nft);
    setModalAction(action);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedNFT(null);
  };

  const handleList = async (tokenId, price) => {
    try {
      await listNFT(tokenId, price);
      handleCloseModal();
      // Refetch user stats to update listings
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Listing failed:', error);
    }
  };

  const handleAuction = (tokenId, startPrice, duration, minIncrement, auctionType, buyNowPrice) => {
    createAuction(tokenId, startPrice, duration, minIncrement, auctionType, buyNowPrice);
    handleCloseModal();
  };

  if (!address) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">Please connect your wallet to view your profile</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Profile Header */}
        <div className="glass-panel">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-black" />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-emerald-200">
                    {creatorProfile?.name || `${address.slice(0, 6)}...${address.slice(-4)}`}
                  </h1>
                  <button className="p-2 text-green-200/70 hover:text-emerald-300 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-green-200/70 mb-4">
                  {creatorProfile?.bio || 'Digital artist and NFT collector'}
                </p>
                <div className="flex items-center space-x-6 text-sm text-green-200/60">
                  <span>Joined Dec 2024</span>
                  <span>•</span>
                  <span>{creatorProfile?.verified ? 'Verified Creator' : 'Member'}</span>
                </div>
              </div>

              {/* Settings Button */}
              <button className="flex items-center px-4 py-2 glass-panel rounded-lg hover:neon-glow transition-colors">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="glass-panel p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mr-4">
                    <Package className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-300">{stats.owned}</div>
                    <div className="text-green-200/70">Owned</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-300">{stats.created}</div>
                    <div className="text-green-200/70">Created</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-300">{stats.sold}</div>
                    <div className="text-green-200/70">Sold</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-xl">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-300">{stats.totalEarnings} ETH</div>
                    <div className="text-green-200/70">Earnings</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="glass-panel rounded-xl">
            <div className="border-b border-[#133027]">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.key
                        ? 'border-emerald-400 text-emerald-300'
                        : 'border-transparent text-green-200/70 hover:text-emerald-200 hover:border-[#133027]'
                        }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'owned' && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-200 mb-4">Your NFTs</h3>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    </div>
                  ) : ownedNFTs.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-green-200/40 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-emerald-200 mb-2">No NFTs owned</h4>
                      <p className="text-green-200/70">Start collecting NFTs from the marketplace</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {ownedNFTs.map((nft) => (
                        <div key={nft.tokenId} className="glass-panel rounded-lg overflow-hidden">
                          {nft.imageUrl ? (
                            <img
                              src={nft.imageUrl}
                              alt={`NFT #${nft.tokenId}`}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-[#0e1518] flex items-center justify-center text-green-200/60">No image</div>
                          )}
                          <div className="p-4">
                            <h4 className="font-semibold text-emerald-200 mb-1">
                              {nft.metadata?.name || `NFT #${nft.tokenId}`}
                            </h4>
                            <p className="text-sm text-green-200/70 mb-2">
                              {nft.tokenData?.category || 'Art'}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-emerald-500 text-black">
                                Owned
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleOpenModal(nft, 'list')}
                                  disabled={isListing}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-emerald-500 to-lime-500 text-black rounded-lg hover:from-emerald-400 hover:to-lime-400 disabled:opacity-50 transition-colors neon-glow"
                                >
                                  List
                                </button>
                                <button
                                  onClick={() => handleOpenModal(nft, 'auction')}
                                  disabled={isCreatingAuction}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-emerald-500 to-lime-500 text-black rounded-lg hover:from-emerald-400 hover:to-lime-400 disabled:opacity-50 transition-colors neon-glow"
                                >
                                  Auction
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'created' && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-200 mb-4">Created NFTs</h3>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    </div>
                  ) : createdNFTs.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="w-16 h-16 text-green-200/40 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-emerald-200 mb-2">No NFTs created yet</h4>
                      <p className="text-green-200/70">Create your first NFT to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {createdNFTs.map((nft) => (
                        <div key={nft.tokenId} className="glass-panel rounded-lg overflow-hidden">
                          {nft.imageUrl ? (
                            <img
                              src={nft.imageUrl}
                              alt={`NFT #${nft.tokenId}`}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-[#0e1518] flex items-center justify-center text-green-200/60">No image</div>
                          )}
                          <div className="p-4">
                            <h4 className="font-semibold text-emerald-200 mb-1">
                              {nft.metadata?.name || `NFT #${nft.tokenId}`}
                            </h4>
                            <p className="text-sm text-green-200/70 mb-2">
                              {nft.tokenData?.category || 'Art'}
                            </p>
                            <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-emerald-500 text-black">
                              Created
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-200 mb-4">Favorite NFTs</h3>
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-green-200/40 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-emerald-200 mb-2">No favorites yet</h4>
                    <p className="text-green-200/70">Like NFTs to add them to your favorites</p>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-200 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {userListings.length === 0 && userAuctions.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="w-16 h-16 text-green-200/40 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-emerald-200 mb-2">No recent activity</h4>
                        <p className="text-green-200/70">Your listings and auctions will appear here</p>
                      </div>
                    ) : (
                      <>
                        {userListings.map((l) => (
                          <div key={`listing-${l.listingId}`} className="flex items-center p-4 glass-panel rounded-lg">
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-4">
                              <User className="w-5 h-5 text-black" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-emerald-200">Listed NFT #{l.tokenId}</p>
                              <p className="text-sm text-green-200/70">Price: {Number(l.price) / 1e18} ETH</p>
                            </div>
                          </div>
                        ))}
                        {userAuctions.map((a) => (
                          <div key={`auction-${a.id}`} className="flex items-center p-4 glass-panel rounded-lg">
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-4">
                              <TrendingUp className="w-5 h-5 text-black" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-emerald-200">Auctioning NFT #{a.tokenId}</p>
                              <p className="text-sm text-green-200/70">Ends at {new Date(a.endTime).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NFT Action Modal */}
      <NFTActionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        nft={selectedNFT}
        action={modalAction}
        onList={handleList}
        onAuction={handleAuction}
        isListing={isListing}
        isCreatingAuction={isCreatingAuction}
      />
    </Layout>
  );
}
