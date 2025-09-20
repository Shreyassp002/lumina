"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useAllAuctions } from "../../hooks/useAuction";
import Layout from "../../components/ui/Layout";
import {
  AuctionCard,
  preloadAuctionComponents,
} from "../../components/common/LazyComponents";
import NFTDetailsModal from "../../components/nft/NFTDetailsModal";
import { Gavel, Clock, TrendingUp } from "lucide-react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { formatEther } from "viem";

// Preload auction components when this module loads
preloadAuctionComponents();

export default function AuctionsPage() {
  const { address } = useAccount();
  const [filter, setFilter] = useState("all"); // all, active, ending-soon, ended
  const { data: auctions = [], isLoading: loading } = useAllAuctions();
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [selectedNFTData, setSelectedNFTData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredAuctions = auctions.filter((auction) => {
    const now = Date.now();
    const timeLeft = auction.endTime - now;

    switch (filter) {
      case "active":
        return auction.status === "active" && timeLeft > 0;
      case "ending-soon":
        return (
          auction.status === "active" &&
          timeLeft > 0 &&
          timeLeft < 60 * 60 * 1000
        ); // Less than 1 hour
      case "ended":
        return auction.status === "ended" || timeLeft <= 0;
      default:
        return true;
    }
  });

  const activeAuctions = auctions.filter(
    (a) => a.status === "active" && a.endTime > Date.now()
  ).length;
  const totalVolumeWei = auctions.reduce((sum, a) => {
    const val =
      a.currentBid && a.currentBid > 0n ? a.currentBid : a.startPrice || 0n;
    return (
      (typeof sum === "bigint" ? sum : BigInt(0)) +
      (typeof val === "bigint" ? val : BigInt(val || 0))
    );
  }, 0n);

  const sectionRef = useRef(null);

  // Handle card click to open modal
  const handleCardClick = (tokenId, nftData) => {
    setSelectedTokenId(tokenId);
    setSelectedNFTData(nftData);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTokenId(null);
    setSelectedNFTData(null);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Clear any existing properties first
      gsap.set(el.querySelectorAll(".fade-section"), { clearProps: "all" });

      gsap.utils.toArray(el.querySelectorAll(".fade-section")).forEach((s) => {
        gsap.fromTo(
          s,
          {
            opacity: 0,
            y: 12,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: s,
              start: "top 85%",
              toggleActions: "play none none reverse",
              refreshPriority: -1, // Lower priority to avoid conflicts
            },
          }
        );
      });
    }, el);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh(); // Refresh ScrollTrigger after cleanup
    };
  }, [filteredAuctions.length]); // Re-run when auction list changes

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-green-200/70">Loading auctions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div ref={sectionRef} className="min-h-screen">
        {/* Header */}
        <div className="glass-panel fade-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-200 mb-4">
                NFT Auctions
              </h1>
              <p className="text-xl text-green-200/70 max-w-2xl mx-auto">
                Bid on unique NFTs and discover rare digital collectibles
                through our auction system
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel p-6 rounded-xl">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mr-4">
                  <Gavel className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-300">
                    {activeAuctions}
                  </div>
                  <div className="text-green-200/70">Active Auctions</div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-300">
                    {
                      auctions.filter(
                        (a) =>
                          a.status === "active" &&
                          a.endTime - Date.now() < 60 * 60 * 1000
                      ).length
                    }
                  </div>
                  <div className="text-green-200/70">Ending Soon</div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-300">
                    {formatEther(totalVolumeWei)} STT
                  </div>
                  <div className="text-green-200/70">Total Volume</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 glass-panel p-1 rounded-lg mb-8 fade-section">
            {[
              { key: "all", label: "All Auctions" },
              { key: "active", label: "Active" },
              { key: "ending-soon", label: "Ending Soon" },
              { key: "ended", label: "Ended" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-[#0e1518] text-emerald-300 accent-ring"
                    : "text-green-200/70 hover:text-emerald-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Auction Grid */}
          {filteredAuctions.length === 0 ? (
            <div className="text-center py-12 fade-section">
              <Gavel className="w-16 h-16 text-green-200/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-emerald-200 mb-2">
                No auctions found
              </h3>
              <p className="text-green-200/70">
                {filter === "all"
                  ? "No auctions are currently available"
                  : `No ${filter.replace("-", " ")} auctions found`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 fade-section">
              {filteredAuctions.map((auction) => (
                <AuctionCard
                  key={`${auction.id}-${auction.tokenId}-${filter}`}
                  auction={auction}
                  currentUser={address}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* NFT Details Modal */}
        <NFTDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          tokenId={selectedTokenId}
          initialData={selectedNFTData}
        />
      </div>
    </Layout>
  );
}
