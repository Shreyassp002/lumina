# Lumina NFT Marketplace Contracts

A comprehensive NFT marketplace platform built for Somnia Network with support for minting, auctions, and fixed-price sales.

## Architecture

### Smart Contracts

- **LuminaNFT**: Core NFT contract with royalties and creator profiles
- **LuminaAuction**: English auction system with anti-sniping protection
- **LuminaMarketplace**: Fixed-price marketplace with integrated royalty distribution

### Key Features

- ERC721 NFTs with ERC2981 royalty standard
- Creator verification and profiles
- English auctions with time extensions
- Fixed-price marketplace listings
- Automatic royalty distribution
- Platform fee collection
- Gas-optimized implementations

## Quick Start

### Prerequisites

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Deploy to Somnia Testnet

```bash
npm run deploy:somnia
```

### Test Deployment

```bash
npm run test:deployment:somnia
```

## Supported Networks

| Network        | Command                        | Chain ID | RPC URL                          |
| -------------- | ------------------------------ | -------- | -------------------------------- |
| Somnia Testnet | `npm run deploy:somnia`        | 50311    | https://dream-rpc.somnia.network |
| Somnia Devnet  | `npm run deploy:somnia-devnet` | 50311    | https://dream-rpc.somnia.network |
| Sepolia        | `npm run deploy:sepolia`       | 11155111 | Alchemy RPC                      |
| Local          | `npm run deploy:local`         | 31337    | localhost:8545                   |

## Contract Sizes

| Contract          | Size    | Status    |
| ----------------- | ------- | --------- |
| LuminaNFT         | 8.3 KiB | Optimized |
| LuminaAuction     | 6.4 KiB | Optimized |
| LuminaMarketplace | 5.7 KiB | Optimized |

All contracts are well under the 24 KiB limit and ready for deployment.

## Configuration

### Environment Variables

Create a `.env` file with:

```bash
SOMNIA_TESTNET_RPC_URL="https://dream-rpc.somnia.network"
SEPOLIA_RPC_URL="your_sepolia_rpc_url"
PRIVATE_KEY="your_private_key"
ETHERSCAN_API_KEY="your_etherscan_api_key"
```

### MetaMask Setup

Add Somnia Testnet to MetaMask:

- Network Name: `Somnia Testnet`
- RPC URL: `https://dream-rpc.somnia.network`
- Chain ID: `50311`
- Currency: `STM`
- Explorer: `https://somnia-devnet.socialscan.io/`

## Available Scripts

### Development

- `npm run compile` - Compile contracts
- `npm run test` - Run tests
- `npm run size` - Check contract sizes
- `npm run coverage` - Generate coverage report

### Deployment

- `npm run deploy:somnia` - Deploy to Somnia testnet
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run deploy:local` - Deploy to local network

### Testing

- `npm run test:deployment:somnia` - Test Somnia deployment
- `npm run test:deployment:sepolia` - Test Sepolia deployment

### Code Quality

- `npm run lint` - Lint Solidity code
- `npm run format` - Format code with Prettier

## Usage Examples

### Mint an NFT

```javascript
const tx = await luminaNFT.mintNFT(
    "ipfs://QmYourMetadataHash", // metadata URI
    500, // 5% royalty
    "Digital Art", // category
    { value: ethers.parseEther("0.001") }, // mint fee
)
```

### Create an Auction

```javascript
const tx = await luminaAuction.createAuction(
    tokenId, // NFT token ID
    ethers.parseEther("0.1"), // starting price
    86400, // 24 hours duration
    ethers.parseEther("0.01"), // min increment
    0, // English auction
    ethers.parseEther("1.0"), // buy now price
)
```

### List for Fixed Price

```javascript
const tx = await luminaMarketplace.listItem(
    tokenId, // NFT token ID
    ethers.parseEther("0.5"), // listing price
)
```

## 🔍 Contract Verification

After deployment, verify contracts on block explorer:

```bash
npx hardhat verify --network somniaTestnet <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
```

## Project Structure

```
contracts/
├── contracts/
│   ├── LuminaNFT.sol           # Core NFT contract
│   ├── LuminaAuction.sol       # Auction system
│   └── LuminaMarketplace.sol   # Marketplace contract
├── scripts/
│   ├── deploy-somnia.js        # Deployment script
│   └── test-deployment.js      # Deployment test
├── deployments/                # Deployment artifacts
├── hardhat.config.js          # Hardhat configuration
├── helper-hardhat-config.js   # Network helpers
└── SOMNIA_SETUP.md            # Somnia setup guide
```

## 🛡️ Security Features

- ReentrancyGuard on all state-changing functions
- Pausable contracts for emergency stops
- Ownable access control
- Input validation and bounds checking
- Safe math operations
- Proper event emission

## Next Steps

1. **Deploy to Somnia Testnet**: `npm run deploy:somnia`
2. **Test Contract Functions**: Use the test script
3. **Build Frontend**: Connect React/Next.js frontend
4. **Add IPFS Integration**: For metadata and media storage
5. **Implement Backend**: For enhanced search and analytics
6. **Security Audit**: Before mainnet deployment

## Support

- [Somnia Documentation](https://docs.somnia.network/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs/)

---

Built with ❤️ for the Somnia Network ecosystem
