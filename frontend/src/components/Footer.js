import Link from 'next/link';
import { Sparkles, Twitter, Github, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0a0f11] text-[#e6ffec] border-t border-[#133027]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center neon-glow">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">Lumina</span>
            </Link>
            <p className="text-green-200/70 mb-4 max-w-md">
              Discover, create, and trade NFTs on the Somnia blockchain.
              Experience the future of digital art with our cutting-edge marketplace.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-300">Marketplace</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/marketplace" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                  Browse NFTs
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                  Create NFT
                </Link>
              </li>
              <li>
                <Link href="/auctions" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                  Auctions
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-emerald-300">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-green-200/70 hover:text-emerald-300 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#133027] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-green-200/70 text-sm">
            © 2024 Lumina NFT Marketplace. All rights reserved.
          </p>
          <p className="text-green-200/70 text-sm mt-2 md:mt-0">
            Built on <span className="text-emerald-300">Somnia Network</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
