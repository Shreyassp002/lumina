# Lumina NFT Marketplace Frontend

A modern, responsive frontend for the Lumina NFT Marketplace built with Next.js, Tailwind CSS, and Web3 integration.

## Features

- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Web3 Integration**: Wallet connection with RainbowKit and Wagmi
- **NFT Marketplace**: Browse, buy, and sell NFTs
- **Auction System**: Real-time bidding with anti-sniping protection
- **NFT Creation**: Easy minting interface with IPFS integration
- **User Profiles**: Personal dashboards and activity tracking
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi v2, RainbowKit, Viem
- **Icons**: Lucide React
- **Animations**: GSAP with React integration
- **State Management**: TanStack Query (React Query)
- **Testing**: Vitest with React Testing Library

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
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── providers/       # React context providers
│   └── test/            # Test utilities
├── abi/                 # Smart contract ABIs
│   ├── luminaNft.js     # NFT contract ABI
│   ├── luminaMarketplace.js # Marketplace contract ABI
│   └── luminaAuction.js # Auction contract ABI
├── public/              # Static assets
│   └── logo/           # Brand logos
├── scripts/            # Build and utility scripts
└── package.json        # Dependencies and scripts
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

- **Chain ID**: 50312
- **RPC URL**: https://dream-rpc.somnia.network
- **Currency**: STT
- **Block Explorer**: https://shannon-explorer.somnia.network/

## Development

### Available Scripts

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build for production with Turbopack
- `npm run build:analyze`: Build with bundle analysis
- `npm run analyze`: Analyze bundle size
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run test`: Run tests with Vitest
- `npm run test:run`: Run tests once

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

---

Built with ❤️ for the Somnia Network ecosystem
