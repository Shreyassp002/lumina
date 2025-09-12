"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import {
  useMarketplaceApproval,
  useAuctionApproval,
  useApproveMarketplace,
  useApproveAuction,
} from "../../hooks/useApproval";
import {
  X,
  DollarSign,
  Clock,
  Gavel,
  Zap,
  Shield,
  AlertCircle,
} from "lucide-react";
import { LUMINA_MARKETPLACE_ADDRESS } from "../../../abi/luminaMarketplace";
import { gsap } from "../../lib/gsap";

export default function NFTActionModal({
  isOpen,
  onClose,
  nft,
  action,
  onList,
  onAuction,
  isListing,
  isCreatingAuction,
}) {
  const { address } = useAccount();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    price: "",
    startPrice: "",
    duration: "",
    minIncrement: "",
    buyNowPrice: "",
  });
  const [errors, setErrors] = useState({});
  const [needsApproval, setNeedsApproval] = useState(false);

  // Check approvals
  const { data: marketplaceApproval } = useMarketplaceApproval(
    nft?.tokenId,
    address
  );
  const { data: auctionApproval } = useAuctionApproval(nft?.tokenId, address);
  const { approveMarketplace, isPending: isApprovingMarketplace } =
    useApproveMarketplace();
  const { approveAuction, isPending: isApprovingAuction } = useApproveAuction();

  useEffect(() => {
    if (nft && address) {
      if (action === "list") {
        setNeedsApproval(marketplaceApproval !== LUMINA_MARKETPLACE_ADDRESS);
      } else if (action === "auction") {
        setNeedsApproval(!auctionApproval);
      }
    }
  }, [nft, address, action, marketplaceApproval, auctionApproval]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (action === "list") {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = "Please enter a valid price";
      }
    } else if (action === "auction") {
      if (!formData.startPrice || parseFloat(formData.startPrice) <= 0) {
        newErrors.startPrice = "Please enter a valid starting price";
      }
      if (!formData.duration || parseInt(formData.duration) < 1) {
        newErrors.duration = "Duration must be at least 1 hour";
      }
      if (
        formData.buyNowPrice &&
        parseFloat(formData.buyNowPrice) <= parseFloat(formData.startPrice)
      ) {
        newErrors.buyNowPrice =
          "Buy now price must be higher than starting price";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApproval = async () => {
    try {
      if (action === "list") {
        await approveMarketplace(nft.tokenId);
      } else if (action === "auction") {
        await approveAuction();
      }
      setNeedsApproval(false);
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (action === "list") {
      onList(
        nft.tokenId,
        BigInt(Math.floor(parseFloat(formData.price) * 1e18))
      );
    } else if (action === "auction") {
      const minIncrement =
        formData.minIncrement || parseFloat(formData.startPrice) * 0.1;
      onAuction(
        nft.tokenId,
        BigInt(Math.floor(parseFloat(formData.startPrice) * 1e18)),
        parseInt(formData.duration) * 3600,
        BigInt(Math.floor(minIncrement * 1e18)),
        0, // English auction
        formData.buyNowPrice
          ? BigInt(Math.floor(parseFloat(formData.buyNowPrice) * 1e18))
          : null
      );
    }
  };

  useEffect(() => {
    const overlay = overlayRef.current;
    const modal = modalRef.current;
    if (!overlay || !modal) return;
    if (isOpen) {
      gsap.set(overlay, { opacity: 0 });
      gsap.set(modal, { y: 16, opacity: 0 });
      gsap.to(overlay, { opacity: 1, duration: 0.2, ease: "linear" });
      gsap.to(modal, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="glass-panel rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#133027]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center">
              {action === "list" ? (
                <DollarSign className="w-5 h-5 text-black" />
              ) : (
                <Gavel className="w-5 h-5 text-black" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-200">
                {action === "list" ? "List for Sale" : "Create Auction"}
              </h2>
              <p className="text-sm text-green-200/70">
                {nft.metadata?.name || `NFT #${nft.tokenId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#0e1518] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-green-200/70" />
          </button>
        </div>

        {/* NFT Preview */}
        <div className="p-6 border-b border-[#133027]">
          <div className="flex items-center space-x-4">
            {nft.imageUrl ? (
              <img
                src={nft.imageUrl}
                alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-[#0e1518] rounded-lg flex items-center justify-center">
                <span className="text-green-200/70 text-xs">No image</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-emerald-200">
                {nft.metadata?.name || `NFT #${nft.tokenId}`}
              </h3>
              <p className="text-sm text-green-200/70">
                {nft.tokenData?.category || "Art"}
              </p>
            </div>
          </div>
        </div>

        {/* Approval Notice */}
        {needsApproval && (
          <div className="p-6 border-b border-[#133027] bg-[#0e1518]">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-300">
                  Approval Required
                </h3>
                <p className="text-sm text-yellow-200 mt-1">
                  You need to approve the{" "}
                  {action === "list" ? "marketplace" : "auction"} contract to
                  transfer this NFT.
                </p>
                <button
                  type="button"
                  onClick={handleApproval}
                  disabled={isApprovingMarketplace || isApprovingAuction}
                  className="mt-3 px-4 py-2 bg-yellow-400 text-black text-sm rounded-lg hover:bg-yellow-300 disabled:opacity-50 flex items-center"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {isApprovingMarketplace || isApprovingAuction
                    ? "Approving..."
                    : "Approve Contract"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {action === "list" ? (
            <div>
              <label className="block text-sm font-medium text-green-200/80 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Listing Price (STT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.1"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.price ? "border-red-300" : "border-gray-300"
                    }`}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-200/70">
                  STT
                </span>
              </div>
              {errors.price && (
                <p className="text-red-400 text-sm mt-1">{errors.price}</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-green-200/80 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Starting Price (STT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.startPrice}
                    onChange={(e) =>
                      handleInputChange("startPrice", e.target.value)
                    }
                    placeholder="0.1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.startPrice ? "border-red-300" : "border-gray-300"
                      }`}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-200/70">
                    STT
                  </span>
                </div>
                {errors.startPrice && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.startPrice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-green-200/80 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                  placeholder="24"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.duration ? "border-red-300" : "border-gray-300"
                    }`}
                />
                {errors.duration && (
                  <p className="text-red-400 text-sm mt-1">{errors.duration}</p>
                )}
                <p className="text-sm text-green-200/70 mt-1">
                  Minimum 1 hour, maximum 30 days
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-200/80 mb-2">
                  <Gavel className="w-4 h-4 inline mr-1" />
                  Minimum Bid Increment (STT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.minIncrement}
                    onChange={(e) =>
                      handleInputChange("minIncrement", e.target.value)
                    }
                    placeholder="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-200/70">
                    STT
                  </span>
                </div>
                <p className="text-sm text-green-200/70 mt-1">
                  Leave empty for 10% of starting price
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-200/80 mb-2">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Buy Now Price (STT) - Optional
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.buyNowPrice}
                    onChange={(e) =>
                      handleInputChange("buyNowPrice", e.target.value)
                    }
                    placeholder="1.0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.buyNowPrice ? "border-red-300" : "border-gray-300"
                      }`}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-200/70">
                    STT
                  </span>
                </div>
                {errors.buyNowPrice && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.buyNowPrice}
                  </p>
                )}
                <p className="text-sm text-green-200/70 mt-1">
                  Allow instant purchase at this price
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={needsApproval || isListing || isCreatingAuction}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isListing || isCreatingAuction ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isListing ? "Listing..." : "Creating..."}
                </>
              ) : (
                <>
                  {action === "list" ? (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      List NFT
                    </>
                  ) : (
                    <>
                      <Gavel className="w-4 h-4 mr-2" />
                      Create Auction
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
