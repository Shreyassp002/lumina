'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'photography', label: 'Photography' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'sports', label: 'Sports' },
  { value: 'collectibles', label: 'Collectibles' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export default function FilterPanel({ filters, onFiltersChange }) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const handlePriceChange = (index, value) => {
    const newPriceRange = [...filters.priceRange];
    newPriceRange[index] = parseFloat(value) || 0;
    onFiltersChange({ ...filters, priceRange: newPriceRange });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: 'all',
      priceRange: [0, 1000],
      verifiedOnly: false,
      sortBy: 'newest'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Category Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between"
            >
              <span>{categories.find(c => c.value === filters.category)?.label}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {showCategoryDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => {
                      onFiltersChange({ ...filters, category: category.value });
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      filters.category === category.value ? 'bg-purple-50 text-purple-600' : ''
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (ETH)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange[0]}
              onChange={(e) => handlePriceChange(0, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceChange(1, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between"
            >
              <span>{sortOptions.find(s => s.value === filters.sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {showSortDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onFiltersChange({ ...filters, sortBy: option.value });
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      filters.sortBy === option.value ? 'bg-purple-50 text-purple-600' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verified Only */}
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => onFiltersChange({ ...filters, verifiedOnly: e.target.checked })}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">Verified creators only</span>
          </label>
        </div>
      </div>
    </div>
  );
}

