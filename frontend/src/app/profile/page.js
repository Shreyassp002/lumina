'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Layout from '../../components/Layout';
import { useUserStats } from '../../hooks/useUserStats';
import { useCreatorProfile } from '../../hooks/useNFT';
import { User, Package, Heart, TrendingUp, Settings, Edit3, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('owned');
  
  // Use custom hooks to get real contract data
  const { stats, ownedNFTs, userListings, userAuctions, isLoading } = useUserStats(address);
  const { data: creatorProfile, isLoading: profileLoading } = useCreatorProfile(address);

  const tabs = [
    { key: 'owned', label: 'Owned', icon: Package },
    { key: 'created', label: 'Created', icon: User },
    { key: 'favorites', label: 'Favorites', icon: Heart },
    { key: 'activity', label: 'Activity', icon: TrendingUp },
  ];

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
      <div className="min-h-screen bg-gray-50">
        {/* Profile Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {creatorProfile?.name || `${address.slice(0, 6)}...${address.slice(-4)}`}
                  </h1>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">
                  {creatorProfile?.bio || 'Digital artist and NFT collector'}
                </p>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>Joined Dec 2024</span>
                  <span>•</span>
                  <span>{creatorProfile?.verified ? 'Verified Creator' : 'Member'}</span>
                </div>
              </div>

              {/* Settings Button */}
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
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
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.owned}</div>
                    <div className="text-gray-600">Owned</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.created}</div>
                    <div className="text-gray-600">Created</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.sold}</div>
                    <div className="text-gray-600">Sold</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalEarnings} ETH</div>
                    <div className="text-gray-600">Earnings</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === tab.key
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your NFTs</h3>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : ownedNFTs.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No NFTs owned</h4>
                      <p className="text-gray-600">Start collecting NFTs from the marketplace</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {ownedNFTs.map((nft) => (
                        <div key={nft.tokenId} className="bg-gray-50 rounded-lg overflow-hidden">
                          <img
                            src={`https://picsum.photos/400/400?random=${nft.tokenId}`}
                            alt={`NFT #${nft.tokenId}`}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1">NFT #{nft.tokenId}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {nft.tokenData?.category || 'Art'}
                            </p>
                            <div className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Owned
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Created NFTs</h3>
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No NFTs created yet</h4>
                    <p className="text-gray-600">Create your first NFT to get started</p>
                  </div>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite NFTs</h3>
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h4>
                    <p className="text-gray-600">Like NFTs to add them to your favorites</p>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Purchased NFT #123</p>
                        <p className="text-sm text-gray-600">2 hours ago</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">1.5 ETH</div>
                    </div>
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Created NFT #456</p>
                        <p className="text-sm text-gray-600">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
