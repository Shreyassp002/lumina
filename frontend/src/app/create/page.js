'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useMintNFT } from '../../hooks/useNFT';
import Layout from '../../components/Layout';
import { Upload, Image as ImageIcon, FileText, DollarSign, Tag, Sparkles } from 'lucide-react';

export default function CreatePage() {
  const { address } = useAccount();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'art',
    royalty: 2.5,
    image: null,
    imagePreview: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Use custom hook for minting
  const { mintNFT, isPending: isMinting, isConfirming, isConfirmed } = useMintNFT();

  const categories = [
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'photography', label: 'Photography' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'sports', label: 'Sports' },
    { value: 'collectibles', label: 'Collectibles' },
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert('File size must be less than 50MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMint = async () => {
    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    if (!formData.image || !formData.name || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.royalty > 10) {
      alert('Royalty percentage cannot exceed 10%');
      return;
    }

    try {
      setUploadError('');
      setIsUploading(true);

      // Build multipart form and upload to API → nft.storage
      const multipart = new FormData();
      multipart.append('image', formData.image);
      multipart.append('name', formData.name);
      multipart.append('description', formData.description);
      multipart.append('category', formData.category);

      const resp = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: multipart,
      });

      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e?.error || 'Upload failed');
      }

      const { metadataURI } = await resp.json();
      if (!metadataURI) throw new Error('No metadataURI returned');

      const royaltyBps = Math.floor(formData.royalty * 100); // Convert to basis points
      await mintNFT(metadataURI, royaltyBps, formData.category);
    } catch (error) {
      console.error('Minting failed:', error);
      setUploadError(String(error?.message || error));
      alert('Minting failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!address) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">Please connect your wallet to create NFTs</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-200 mb-4">
              Create Your NFT
            </h1>
            <p className="text-xl text-green-200/70">
              Upload your digital art and mint it as an NFT on the Somnia blockchain
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-green-200/80 mb-4">
                  Upload Image *
                </label>
                <div className="border-2 border-dashed border-[#133027] rounded-lg p-8 text-center hover:border-emerald-400 transition-colors">
                  {formData.imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: null }))}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-green-200/60 mx-auto mb-4" />
                      <p className="text-green-200/70 mb-2">Drag and drop your image here</p>
                      <p className="text-sm text-green-200/60 mb-4">or click to browse</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-lime-500 text-black rounded-lg hover:from-emerald-400 hover:to-lime-400 cursor-pointer transition-colors neon-glow"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </label>
                      <p className="text-xs text-green-200/60 mt-2">Max 50MB. JPG, PNG, GIF, SVG supported</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-green-200/80 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    NFT Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter a unique name for your NFT"
                    className="w-full px-4 py-3 glass-panel rounded-lg focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-green-200/80 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your NFT and its story"
                    rows={4}
                    className="w-full px-4 py-3 glass-panel rounded-lg focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-green-200/80 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 glass-panel rounded-lg focus:outline-none"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Royalty */}
                <div>
                  <label className="block text-sm font-medium text-green-200/80 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Royalty Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={formData.royalty}
                      onChange={(e) => handleInputChange('royalty', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 glass-panel rounded-lg pr-8 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-200/70">
                      %
                    </span>
                  </div>
                  <p className="text-sm text-green-200/70 mt-1">
                    You&apos;ll receive this percentage from future sales (max 10%)
                  </p>
                </div>

                {/* Mint Button */}
                <button
                  onClick={handleMint}
                  disabled={isUploading || isMinting || isConfirming || !formData.image || !formData.name || !formData.description}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-semibold rounded-lg hover:from-emerald-400 hover:to-lime-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center neon-glow"
                >
                  {isUploading || isMinting || isConfirming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isUploading ? 'Uploading to IPFS...' : isConfirming ? 'Confirming...' : 'Minting...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Mint NFT
                    </>
                  )}
                </button>

                {uploadError && (
                  <div className="p-3 bg-[#2a0f0f] border border-red-400/40 rounded-lg text-red-400 text-sm">
                    {uploadError}
                  </div>
                )}

                {isConfirmed && (
                  <div className="p-4 bg-[#0e1518] border border-emerald-400/40 rounded-lg">
                    <p className="text-emerald-300 font-medium">NFT minted successfully!</p>
                    <p className="text-green-200/80 text-sm mt-1">
                      Your NFT is now live on the blockchain.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
