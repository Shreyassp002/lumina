"use client";

import { useState, useEffect, useRef } from "react";
import Layout from "../../components/ui/Layout";
import {
  MarketplaceGrid,
  preloadMarketplaceComponents,
} from "../../components/common/LazyComponents";
import FilterPanel from "../../components/marketplace/FilterPanel";
import { Search, Filter } from "lucide-react";
import { gsap, ScrollTrigger } from "../../lib/gsap";

// Preload marketplace components when this module loads
preloadMarketplaceComponents();

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    priceRange: [0, 1000],
    verifiedOnly: false,
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(el.querySelectorAll(".fade-section")).forEach((s) => {
        gsap.from(s, {
          opacity: 0,
          y: 12,
          duration: 0.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: s,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Layout>
      <div ref={sectionRef} className="min-h-screen">
        {/* Header */}
        <div className="glass-panel fade-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-200 mb-4">
                NFT Marketplace
              </h1>
              <p className="text-xl text-green-200/70 max-w-2xl mx-auto">
                Discover unique digital art and collectibles from talented
                creators around the world
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 fade-section">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200/70 w-5 h-5" />
              <input
                type="text"
                placeholder="Search NFTs, creators, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 glass-panel rounded-lg focus:outline-none"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center px-4 py-3 glass-panel rounded-lg hover:neon-glow transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          <div className={`mt-6 ${showFilters ? "block" : "hidden lg:block"}`}>
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* NFT Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 fade-section">
          <MarketplaceGrid
            searchTerm={searchTerm}
            filters={filters}
            showFilters={showFilters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>
    </Layout>
  );
}
