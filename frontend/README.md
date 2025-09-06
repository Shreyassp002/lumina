# Lumina NFT Marketplace Frontend

A modern, responsive frontend for the Lumina NFT Marketplace built with Next.js, Tailwind CSS, and Web3 integration.

## Features

- 🎨 **Modern UI/UX**: Beautiful, responsive design with smooth animations
- 🔗 **Web3 Integration**: Wallet connection with RainbowKit and Wagmi
- 🖼️ **NFT Marketplace**: Browse, buy, and sell NFTs
- ⚡ **Auction System**: Real-time bidding with anti-sniping protection
- 🎯 **NFT Creation**: Easy minting interface with IPFS integration
- 👤 **User Profiles**: Personal dashboards and activity tracking
- 📱 **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi v2, RainbowKit, Viem
- **Icons**: Lucide React
- **Animations**: GSAP
- **State Management**: React Query (TanStack Query)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- WalletConnect Project ID

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Add your WalletConnect Project ID to `.env.local`:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.js            # Homepage
│   ├── marketplace/       # Marketplace page
│   ├── create/           # NFT creation page
│   ├── auctions/         # Auctions page
│   └── profile/          # User profile page
├── components/           # Reusable UI components
│   ├── Layout.js         # Main layout wrapper
│   ├── Header.js         # Navigation header
│   ├── Footer.js         # Footer component
│   ├── NFTGrid.js        # NFT grid display
│   ├── NFTCard.js        # Individual NFT card
│   ├── AuctionCard.js    # Auction display card
│   └── FilterPanel.js    # Marketplace filters
├── lib/                  # Utility libraries
│   └── wagmi.js          # Wagmi configuration
├── providers/            # React context providers
│   └── Web3Provider.js   # Web3 provider wrapper
└── abi/                  # Smart contract ABIs
    ├── luminaNft.js      # NFT contract ABI
    ├── luminaMarketplace.js # Marketplace contract ABI
    └── luminaAuction.js  # Auction contract ABI
```

## Smart Contract Integration

The frontend integrates with three main smart contracts:

- **LuminaNFT**: NFT minting and management
- **LuminaMarketplace**: Fixed-price sales
- **LuminaAuction**: Auction functionality

Contract addresses are configured in the ABI files and point to the deployed contracts on Somnia testnet.

## Key Features

### Homepage
- Hero section with call-to-action
- Feature highlights
- Statistics display
- Responsive design

### Marketplace
- NFT grid with filtering and search
- Real-time price updates
- Instant purchase functionality
- Creator verification badges

### Auctions
- Live auction display with countdown timers
- Real-time bidding interface
- Anti-sniping protection
- Buy-now functionality

### NFT Creation
- Drag-and-drop image upload
- Metadata form with validation
- Royalty configuration
- Batch minting support

### User Profile
- Personal dashboard
- NFT collection management
- Activity history
- Statistics tracking

## Styling

The project uses Tailwind CSS with custom utilities:

- `.text-gradient`: Purple to blue gradient text
- `.bg-gradient-primary`: Primary gradient background
- `.shadow-glow`: Glowing shadow effect
- `.line-clamp-2/3`: Text truncation utilities

## Web3 Configuration

The app is configured for Somnia testnet:

- **Chain ID**: 50311
- **RPC URL**: https://rpc.somnia.network
- **Currency**: ETH
- **Block Explorer**: https://explorer.somnia.network

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use TypeScript-style prop validation
- Implement proper error handling
- Use semantic HTML elements

## Deployment

The app can be deployed to any platform that supports Next.js:

- Vercel (recommended)
- Netlify
- AWS Amplify
- Self-hosted

Make sure to set the environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Lumina NFT Marketplace ecosystem.