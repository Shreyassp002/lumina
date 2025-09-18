"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { gsap } from "../../lib/gsap";
import { useNFTData } from "../../hooks/useNFT";

export default function NFTDetailsModal({
  isOpen,
  onClose,
  tokenId,
  initialData,
}) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  // Fetch NFT data using existing hook
  const {
    data: nftData,
    isLoading,
    error,
  } = useNFTData(tokenId, {
    enabled: isOpen && !!tokenId,
    includeMetadata: true,
  });

  // Use initial data if available, otherwise use fetched data
  const displayData = initialData || nftData;

  // Handle modal animations
  useEffect(() => {
    const overlay = overlayRef.current;
    const modal = modalRef.current;
    if (!overlay || !modal) return;

    if (isOpen) {
      // Set initial state
      gsap.set(overlay, { opacity: 0 });
      gsap.set(modal, { y: 20, opacity: 0, scale: 0.95 });

      // Animate in with enhanced easing
      gsap.to(overlay, { opacity: 1, duration: 0.25, ease: "power2.out" });
      gsap.to(modal, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.7)",
      });
    }
  }, [isOpen]);

  // Handle ESC key and focus management
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent background scrolling
      document.body.style.overflow = "hidden";

      // Focus management - focus the modal when it opens
      const modal = modalRef.current;
      if (modal) {
        // Focus the close button for keyboard navigation
        const closeButton = modal.querySelector(
          'button[aria-label="Close modal"]'
        );
        if (closeButton) {
          closeButton.focus();
        }
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle click outside and touch events
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Handle touch events for better mobile experience
  const handleTouchStart = (e) => {
    // Prevent iOS bounce scrolling when modal is at top/bottom
    const modal = modalRef.current;
    if (modal) {
      const scrollTop = modal.scrollTop;
      const scrollHeight = modal.scrollHeight;
      const clientHeight = modal.clientHeight;

      if (scrollTop === 0) {
        modal.scrollTop = 1;
      } else if (scrollTop + clientHeight >= scrollHeight) {
        modal.scrollTop = scrollHeight - clientHeight - 1;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="glass-panel rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
        onTouchStart={handleTouchStart}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#133027] sticky top-0 bg-[#0a0f11]/90 backdrop-blur-sm rounded-t-xl sm:rounded-t-2xl">
          <h2
            id="modal-title"
            className="text-lg sm:text-xl font-bold text-emerald-200"
          >
            NFT Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#0e1518] rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-green-200/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {isLoading && !initialData && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-green-200/70">
                Loading NFT details...
              </span>
            </div>
          )}

          {error && !initialData && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Failed to load NFT details</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#0e1518] text-emerald-200 rounded-lg hover:bg-[#133027] transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {displayData && (
            <div className="space-y-6">
              {/* NFT Image and Basic Info */}
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Image */}
                <div className="flex-shrink-0">
                  <div className="w-full sm:w-80 lg:w-80 aspect-square rounded-xl overflow-hidden bg-[#0e1518] transition-transform duration-300 hover:scale-[1.02]">
                    {displayData.imageUrl ? (
                      <img
                        src={displayData.imageUrl}
                        alt={displayData.metadata?.name || `NFT #${tokenId}`}
                        className="w-full h-full object-cover transition-opacity duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-green-200/60 text-sm sm:text-base">
                        No image available
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-emerald-200 mb-2 break-words">
                      {displayData.metadata?.name || `NFT #${tokenId}`}
                    </h3>
                    {displayData.metadata?.description && (
                      <p className="text-sm sm:text-base text-green-200/80 leading-relaxed break-words">
                        {displayData.metadata.description}
                      </p>
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-[#133027]/50 transition-colors duration-200 hover:border-[#133027]">
                      <span className="text-green-200/70 text-sm sm:text-base">
                        Token ID
                      </span>
                      <span className="text-emerald-200 font-mono text-sm sm:text-base">
                        #{tokenId}
                      </span>
                    </div>

                    {displayData.owner && (
                      <div className="flex items-center justify-between py-2 border-b border-[#133027]/50 transition-colors duration-200 hover:border-[#133027]">
                        <span className="text-green-200/70 text-sm sm:text-base">
                          Owner
                        </span>
                        <span className="text-emerald-200 font-mono text-xs sm:text-sm break-all sm:break-normal">
                          <span className="hidden sm:inline">
                            {displayData.owner.slice(0, 6)}...
                            {displayData.owner.slice(-4)}
                          </span>
                          <span className="sm:hidden">
                            {displayData.owner.slice(0, 4)}...
                            {displayData.owner.slice(-3)}
                          </span>
                        </span>
                      </div>
                    )}

                    {displayData.tokenData?.creator && (
                      <div className="flex items-center justify-between py-2 border-b border-[#133027]/50 transition-colors duration-200 hover:border-[#133027]">
                        <span className="text-green-200/70 text-sm sm:text-base">
                          Creator
                        </span>
                        <span className="text-emerald-200 font-mono text-xs sm:text-sm break-all sm:break-normal">
                          <span className="hidden sm:inline">
                            {displayData.tokenData.creator.slice(0, 6)}...
                            {displayData.tokenData.creator.slice(-4)}
                          </span>
                          <span className="sm:hidden">
                            {displayData.tokenData.creator.slice(0, 4)}...
                            {displayData.tokenData.creator.slice(-3)}
                          </span>
                        </span>
                      </div>
                    )}

                    {displayData.tokenData?.category && (
                      <div className="flex items-center justify-between py-2 border-b border-[#133027]/50 transition-colors duration-200 hover:border-[#133027]">
                        <span className="text-green-200/70 text-sm sm:text-base">
                          Category
                        </span>
                        <span className="text-emerald-200 text-sm sm:text-base">
                          {displayData.tokenData.category}
                        </span>
                      </div>
                    )}

                    {displayData.tokenData?.royaltyBps && (
                      <div className="flex items-center justify-between py-2 border-b border-[#133027]/50 transition-colors duration-200 hover:border-[#133027]">
                        <span className="text-green-200/70 text-sm sm:text-base">
                          Royalty
                        </span>
                        <span className="text-emerald-200 text-sm sm:text-base">
                          {displayData.tokenData.royaltyBps / 100}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attributes */}
              {displayData.metadata?.attributes &&
                displayData.metadata.attributes.length > 0 && (
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-emerald-200 mb-4">
                      Attributes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {displayData.metadata.attributes.map((attr, index) => (
                        <div
                          key={index}
                          className="glass-panel p-3 rounded-lg transition-all duration-200 hover:bg-[#0e1518]/80 hover:scale-[1.02] hover:shadow-lg"
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: "fadeInUp 0.3s ease-out forwards",
                          }}
                        >
                          <div className="text-xs text-green-200/70 uppercase tracking-wide mb-1 break-words">
                            {attr.trait_type}
                          </div>
                          <div className="text-emerald-200 font-medium text-sm sm:text-base break-words">
                            {attr.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
