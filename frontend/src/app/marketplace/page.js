'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import NFTGrid from '../../components/NFTGrid';
import FilterPanel from '../../components/FilterPanel';
import { Search, Filter } from 'lucide-react';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: [0, 1000],
    verifiedOnly: false,
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                NFT Marketplace
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover unique digital art and collectibles from talented creators around the world
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search NFTs, creators, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          <div className={`mt-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* NFT Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <NFTGrid 
            searchTerm={searchTerm}
            filters={filters}
          />
        </div>
      </div>
    </Layout>
  );
}

