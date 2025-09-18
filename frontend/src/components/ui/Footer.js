import Link from "next/link";
import { Sparkles, Twitter, Github, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0a0f11] text-[#e6ffec] border-t border-[#133027]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo, Navigation, and Social Icons Row */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center neon-glow">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold">Lumina</span>
          </Link>

          {/* Horizontal Navigation Links */}
          <div className="flex flex-wrap gap-6">
            <Link
              href="/marketplace"
              className="text-green-200/70 hover:text-emerald-300 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/create"
              className="text-green-200/70 hover:text-emerald-300 transition-colors"
            >
              Create NFT
            </Link>
            <Link
              href="/auctions"
              className="text-green-200/70 hover:text-emerald-300 transition-colors"
            >
              Auctions
            </Link>
            <Link
              href="/profile"
              className="text-green-200/70 hover:text-emerald-300 transition-colors"
            >
              My Profile
            </Link>
          </div>

          {/* Social Media Icons */}
          <div className="flex space-x-4">
            <a
              href="https://x.com/Darkreyyy"
              className="text-green-200/70 hover:text-emerald-300 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/Shreyassp002/lumina"
              className="text-green-200/70 hover:text-emerald-300 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="border-t border-[#133027] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-green-200/70 text-sm mt-2 md:mt-0">
            Built on <span className="text-emerald-300">Somnia Network</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
