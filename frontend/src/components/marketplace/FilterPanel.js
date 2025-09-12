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
    <div className="glass-panel rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-emerald-200">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-emerald-300 hover:text-emerald-200 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Category Filter */}
        <div className="relative">
          <label className="block text-sm font-medium text-green-200/80 mb-2">
            Category
          </label>
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-3 py-2 text-left glass-panel rounded-lg flex items-center justify-between"
            >
              <span>{categories.find(c => c.value === filters.category)?.label}</span>
              <ChevronDown className="w-4 h-4 text-green-200/70" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-10 w-full mt-1 glass-panel rounded-lg shadow-lg">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => {
                      onFiltersChange({ ...filters, category: category.value });
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[#0e1518] first:rounded-t-lg last:rounded-b-lg ${filters.category === category.value ? 'text-emerald-300 accent-ring' : ''
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
          <label className="block text-sm font-medium text-green-200/80 mb-2">
            Price Range (STT)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange[0]}
              onChange={(e) => handlePriceChange(0, e.target.value)}
              className="w-full px-3 py-2 glass-panel rounded-lg focus:outline-none"
            />
            <span className="text-green-200/60">to</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceChange(1, e.target.value)}
              className="w-full px-3 py-2 glass-panel rounded-lg focus:outline-none"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="relative">
          <label className="block text-sm font-medium text-green-200/80 mb-2">
            Sort By
          </label>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="w-full px-3 py-2 text-left glass-panel rounded-lg flex items-center justify-between"
            >
              <span>{sortOptions.find(s => s.value === filters.sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4 text-green-200/70" />
            </button>

            {showSortDropdown && (
              <div className="absolute z-10 w-full mt-1 glass-panel rounded-lg shadow-lg">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onFiltersChange({ ...filters, sortBy: option.value });
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-[#0e1518] first:rounded-t-lg last:rounded-b-lg ${filters.sortBy === option.value ? 'text-emerald-300 accent-ring' : ''
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
              className="w-4 h-4 text-emerald-500 bg-[#0e1518] border-[#133027] rounded focus:ring-emerald-500"
            />
            <span className="ml-2 text-sm text-green-200/80">Verified creators only</span>
          </label>
        </div>
      </div>
    </div>
  );
}

