# Lumina Admin Scripts

This directory contains administrative scripts for managing the Lumina NFT marketplace platform contracts.

## 🚀 Quick Start - Most Used Commands

```bash
# Check platform status
npx hardhat admin:status --network somniaTestnet

# Check for auctions needing settlement
npx hardhat admin:check-auctions --network somniaTestnet

# Settle all expired auctions
npx hardhat admin:settle-all --network somniaTestnet

# Verify a creator
npx hardhat admin:verify-creator --address 0x1234... --network somniaTestnet

# Withdraw all platform fees
npx hardhat admin:withdraw-all --network somniaTestnet
```

## Available Scripts

### 1. Interactive Admin Script (`admin-functions.js`)

A comprehensive interactive menu system for all admin functions.

```bash
npx hardhat run scripts/admin-functions.js --network somniaTestnet
```

**Features:**

- Interactive menu with all admin functions
- Real-time contract status display
- Input validation and error handling
- Comprehensive auction management

### 2. Hardhat Admin Tasks (Recommended)

Built-in Hardhat tasks for all admin functions with proper parameter handling.

```bash
# Show all available admin tasks
npx hardhat --help | grep admin

# Working examples
npx hardhat admin:status --network somniaTestnet
npx hardhat admin:verify-creator --address 0x1234... --network somniaTestnet
npx hardhat admin:set-mint-fee --fee 0.002 --network somniaTestnet
npx hardhat admin:settle-auction --id 1 --network somniaTestnet
npx hardhat admin:withdraw-all --network somniaTestnet
```

### 3. Auction Settlement Bot (`settle-auctions.js`)

Automated script for settling expired auctions. Perfect for cron jobs.

```bash
npx hardhat run scripts/settle-auctions.js --network somniaTestnet
```

**Features:**

- Automatically finds and settles expired auctions
- Detailed logging and error handling
- Gas optimization
- Suitable for automation

## 📋 Complete List of Hardhat Admin Tasks

### Status & Monitoring

```bash
npx hardhat admin:status --network somniaTestnet
npx hardhat admin:check-auctions --network somniaTestnet
```

### Auction Management

```bash
npx hardhat admin:settle-auction --id <auction_id> --network somniaTestnet
npx hardhat admin:settle-all --network somniaTestnet
```

### Creator Management

```bash
npx hardhat admin:verify-creator --address <creator_address> --network somniaTestnet
```

### Fee Management

```bash
npx hardhat admin:set-mint-fee --fee <eth_amount> --network somniaTestnet
npx hardhat admin:withdraw-all --network somniaTestnet
```

### Emergency Controls

```bash
npx hardhat admin:pause-nft --network somniaTestnet
npx hardhat admin:unpause-nft --network somniaTestnet
npx hardhat admin:pause-auction --network somniaTestnet
npx hardhat admin:unpause-auction --network somniaTestnet
npx hardhat admin:pause-marketplace --network somniaTestnet
npx hardhat admin:unpause-marketplace --network somniaTestnet
```

## Contract Addresses

The scripts are configured for the following deployed contracts on Somnia Testnet:

- **LuminaNFT**: `0x1037CC8ddDB8aC25B2dcD5dA7815b6c94930A6DB`
- **LuminaAuction**: `0x5DE7F272860556D8650a7916ca84F4Fc4aE089d3`
- **LuminaMarketplace**: `0xCa7680E1511f11BFb1c5BEc584246D8bd4C76d1F`

## Available Admin Functions

### NFT Contract Functions

- **Verify Creator**: Mark a creator as verified
- **Set Mint Fee**: Update the platform mint fee
- **Withdraw Fees**: Withdraw accumulated mint fees
- **Pause/Unpause**: Emergency pause functionality

### Auction Contract Functions

- **Set Platform Fee**: Update auction platform fee (max 10%)
- **Withdraw Fees**: Withdraw accumulated platform fees
- **Settle Auction**: Manually settle expired auctions
- **Pause/Unpause**: Emergency pause functionality

### Marketplace Contract Functions

- **Set Platform Fee**: Update marketplace platform fee (max 10%)
- **Set Auction Contract**: Link to auction contract
- **Withdraw Fees**: Withdraw accumulated platform fees
- **Pause/Unpause**: Emergency pause functionality

## Usage Examples

### Using Hardhat Tasks (Recommended)

1. **Check Platform Status**

```bash
npx hardhat admin:status --network somniaTestnet
```

2. **Check Pending Auctions**

```bash
npx hardhat admin:check-auctions --network somniaTestnet
```

3. **Settle Specific Auction**

```bash
npx hardhat admin:settle-auction --id 1 --network somniaTestnet
```

4. **Settle All Expired Auctions**

```bash
npx hardhat admin:settle-all --network somniaTestnet
```

5. **Withdraw All Platform Fees**

```bash
npx hardhat admin:withdraw-all --network somniaTestnet
```

6. **Verify Creator**

```bash
npx hardhat admin:verify-creator --address 0x1234... --network somniaTestnet
```

### Using Simple Admin Script (Alternative)

1. **Check Platform Status**

```bash
ADMIN_ACTION=status npx hardhat run scripts/simple-admin.js --network somniaTestnet
```

2. **Settle Specific Auction**

```bash
ADMIN_ACTION=settle-auction ADMIN_PARAM1=1 npx hardhat run scripts/simple-admin.js --network somniaTestnet
```

3. **Settle All Auctions**

```bash
ADMIN_ACTION=settle-all npx hardhat run scripts/simple-admin.js --network somniaTestnet
```

### Emergency Actions

1. **Pause All Contracts**

```bash
npx hardhat admin:pause-nft --network somniaTestnet
npx hardhat admin:pause-auction --network somniaTestnet
npx hardhat admin:pause-marketplace --network somniaTestnet
```

2. **Unpause All Contracts**

```bash
npx hardhat admin:unpause-nft --network somniaTestnet
npx hardhat admin:unpause-auction --network somniaTestnet
npx hardhat admin:unpause-marketplace --network somniaTestnet
npx hardhat run scripts/quick-admin.js --network somniaTestnet -- unpause-marketplace
```

### Creator Management

1. **Verify a Creator**

```bash
npx hardhat run scripts/quick-admin.js --network somniaTestnet -- verify-creator 0x742d35Cc6634C0532925a3b8D0C9e3e0C8b4c8e8
```

### Fee Management

1. **Update Mint Fee**

```bash
npx hardhat run scripts/quick-admin.js --network somniaTestnet -- set-mint-fee 0.001
```

2. **Update Platform Fees**

```bash
npx hardhat run scripts/quick-admin.js --network somniaTestnet -- set-auction-fee 2.5
npx hardhat run scripts/quick-admin.js --network somniaTestnet -- set-marketplace-fee 2.5
```

## Automation Setup

### Cron Job for Auction Settlement

Add this to your crontab to automatically settle auctions every hour:

```bash
# Edit crontab
crontab -e

# Add this line (adjust paths as needed)
0 * * * * cd /path/to/your/project && npx hardhat run scripts/settle-auctions.js --network somniaTestnet >> /var/log/lumina-settlement.log 2>&1
```

### Systemd Service for Continuous Monitoring

Create a systemd service for continuous auction monitoring:

```ini
# /etc/systemd/system/lumina-settlement.service
[Unit]
Description=Lumina Auction Settlement Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/project
ExecStart=/usr/bin/npx hardhat run scripts/settle-auctions.js --network somniaTestnet
Restart=always
RestartSec=3600

[Install]
WantedBy=multi-user.target
```

## Security Considerations

1. **Private Key Management**: Ensure your private key in `.env` is secure
2. **Gas Limits**: Scripts include reasonable gas limits to prevent excessive costs
3. **Error Handling**: All scripts include comprehensive error handling
4. **Rate Limiting**: Settlement script includes delays to prevent nonce conflicts

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**: Ensure admin account has enough ETH for gas
2. **"Nonce too low"**: Wait a moment and retry, or restart your node connection
3. **"Contract not approved"**: Ensure contracts are properly deployed and linked
4. **"Auction does not exist"**: Check auction ID exists and is valid

### Debug Mode

For detailed debugging, you can modify the scripts to include more verbose logging:

```javascript
// Add this to any script for more detailed logs
console.log("Debug: Transaction details:", tx)
console.log("Debug: Receipt:", receipt)
```

## Support

For issues or questions about these admin scripts, please check:

1. Contract deployment status
2. Network connectivity to Somnia Testnet
3. Account balance and permissions
4. Recent transaction history for conflicts

## Version History

- **v1.0**: Initial admin scripts with basic functionality
- **v1.1**: Added auction settlement automation
- **v1.2**: Enhanced error handling and logging
