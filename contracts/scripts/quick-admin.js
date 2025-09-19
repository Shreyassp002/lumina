const { ethers } = require("hardhat")
require("dotenv").config()

// Contract addresses from deployments
const LUMINA_NFT_ADDRESS = "0x1037CC8ddDB8aC25B2dcD5dA7815b6c94930A6DB"
const LUMINA_AUCTION_ADDRESS = "0x5DE7F272860556D8650a7916ca84F4Fc4aE089d3"
const LUMINA_MARKETPLACE_ADDRESS = "0xCa7680E1511f11BFb1c5BEc584246D8bd4C76d1F"

async function main() {
    console.log("⚡ Quick Admin Actions for Lumina Platform")
    console.log("==========================================")

    // Get signer (admin account)
    const [admin] = await ethers.getSigners()
    console.log(`Admin address: ${admin.address}`)
    console.log(
        `Admin balance: ${ethers.formatEther(await admin.provider.getBalance(admin.address))} ETH\n`,
    )

    // Get contract instances
    const luminaNFT = await ethers.getContractAt("LuminaNFT", LUMINA_NFT_ADDRESS)
    const luminaAuction = await ethers.getContractAt("LuminaAuction", LUMINA_AUCTION_ADDRESS)
    const luminaMarketplace = await ethers.getContractAt(
        "LuminaMarketplace",
        LUMINA_MARKETPLACE_ADDRESS,
    )

    // Parse command line arguments (skip hardhat-specific args)
    const args = process.argv.slice(2)

    // Find where our actual arguments start (after --network networkName)
    let actionStartIndex = 0
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--network" && i + 1 < args.length) {
            actionStartIndex = i + 2 // Skip --network and network name
            break
        }
    }

    const action = args[actionStartIndex]
    const param1 = args[actionStartIndex + 1]
    const param2 = args[actionStartIndex + 2]

    if (!action) {
        showUsage()
        return
    }

    try {
        switch (action.toLowerCase()) {
            // NFT Contract Actions
            case "verify-creator":
                await verifyCreator(luminaNFT, param1)
                break
            case "set-mint-fee":
                await setMintFee(luminaNFT, param1)
                break
            case "withdraw-nft-fees":
                await withdrawNFTFees(luminaNFT)
                break
            case "pause-nft":
                await pauseNFT(luminaNFT)
                break
            case "unpause-nft":
                await unpauseNFT(luminaNFT)
                break

            // Auction Contract Actions
            case "set-auction-fee":
                await setAuctionFee(luminaAuction, param1)
                break
            case "withdraw-auction-fees":
                await withdrawAuctionFees(luminaAuction)
                break
            case "settle-auction":
                await settleAuction(luminaAuction, param1)
                break
            case "pause-auction":
                await pauseAuction(luminaAuction)
                break
            case "unpause-auction":
                await unpauseAuction(luminaAuction)
                break

            // Marketplace Contract Actions
            case "set-marketplace-fee":
                await setMarketplaceFee(luminaMarketplace, param1)
                break
            case "withdraw-marketplace-fees":
                await withdrawMarketplaceFees(luminaMarketplace)
                break
            case "pause-marketplace":
                await pauseMarketplace(luminaMarketplace)
                break
            case "unpause-marketplace":
                await unpauseMarketplace(luminaMarketplace)
                break

            // Utility Actions
            case "status":
                await showStatus(luminaNFT, luminaAuction, luminaMarketplace)
                break
            case "check-auctions":
                await checkPendingAuctions(luminaAuction)
                break
            case "settle-all":
                await settleAllPendingAuctions(luminaAuction)
                break
            case "withdraw-all":
                await withdrawAllFees(luminaNFT, luminaAuction, luminaMarketplace)
                break

            default:
                console.log(`❌ Unknown action: ${action}`)
                showUsage()
        }
    } catch (error) {
        console.error(`❌ Error executing ${action}:`, error.message)
        if (error.reason) {
            console.error(`Reason: ${error.reason}`)
        }
    }
}

function showUsage() {
    console.log(
        "📖 Usage: npx hardhat run scripts/quick-admin.js --network somniaTestnet -- <action> [params]",
    )
    console.log("")
    console.log("🎨 NFT Contract Actions:")
    console.log("  verify-creator <address>     - Verify a creator")
    console.log("  set-mint-fee <eth_amount>    - Set mint fee in ETH")
    console.log("  withdraw-nft-fees            - Withdraw NFT contract fees")
    console.log("  pause-nft                    - Pause NFT contract")
    console.log("  unpause-nft                  - Unpause NFT contract")
    console.log("")
    console.log("🏛️ Auction Contract Actions:")
    console.log("  set-auction-fee <percent>    - Set auction platform fee (e.g., 2.5)")
    console.log("  withdraw-auction-fees        - Withdraw auction contract fees")
    console.log("  settle-auction <id>          - Settle specific auction")
    console.log("  pause-auction                - Pause auction contract")
    console.log("  unpause-auction              - Unpause auction contract")
    console.log("")
    console.log("🏪 Marketplace Contract Actions:")
    console.log("  set-marketplace-fee <percent> - Set marketplace platform fee (e.g., 2.5)")
    console.log("  withdraw-marketplace-fees     - Withdraw marketplace contract fees")
    console.log("  pause-marketplace             - Pause marketplace contract")
    console.log("  unpause-marketplace           - Unpause marketplace contract")
    console.log("")
    console.log("🔧 Utility Actions:")
    console.log("  status                       - Show all contract statuses")
    console.log("  check-auctions               - Check for auctions needing settlement")
    console.log("  settle-all                   - Settle all pending auctions")
    console.log("  withdraw-all                 - Withdraw fees from all contracts")
    console.log("")
    console.log("📝 Examples:")
    console.log("  npx hardhat run scripts/quick-admin.js --network somniaTestnet -- status")
    console.log(
        "  npx hardhat run scripts/quick-admin.js --network somniaTestnet -- verify-creator 0x1234...",
    )
    console.log(
        "  npx hardhat run scripts/quick-admin.js --network somniaTestnet -- set-mint-fee 0.002",
    )
    console.log(
        "  npx hardhat run scripts/quick-admin.js --network somniaTestnet -- settle-auction 1",
    )
}

// NFT Contract Functions
async function verifyCreator(luminaNFT, address) {
    if (!address || !ethers.isAddress(address)) {
        throw new Error("Invalid creator address")
    }

    console.log(`🔄 Verifying creator: ${address}...`)
    const tx = await luminaNFT.verifyCreator(address)
    await tx.wait()
    console.log(`✅ Creator verified! Transaction: ${tx.hash}`)
}

async function setMintFee(luminaNFT, ethAmount) {
    if (!ethAmount || isNaN(ethAmount)) {
        throw new Error("Invalid ETH amount")
    }

    const feeInWei = ethers.parseEther(ethAmount)
    console.log(`🔄 Setting mint fee to: ${ethAmount} ETH...`)
    const tx = await luminaNFT.setMintFee(feeInWei)
    await tx.wait()
    console.log(`✅ Mint fee updated! Transaction: ${tx.hash}`)
}

async function withdrawNFTFees(luminaNFT) {
    const balance = await ethers.provider.getBalance(LUMINA_NFT_ADDRESS)
    console.log(`💰 NFT Contract balance: ${ethers.formatEther(balance)} ETH`)

    if (balance === 0n) {
        console.log("❌ No fees to withdraw")
        return
    }

    console.log(`🔄 Withdrawing NFT fees...`)
    const tx = await luminaNFT.withdrawFees()
    await tx.wait()
    console.log(`✅ Fees withdrawn! Transaction: ${tx.hash}`)
}

async function pauseNFT(luminaNFT) {
    console.log(`🔄 Pausing NFT contract...`)
    const tx = await luminaNFT.pause()
    await tx.wait()
    console.log(`✅ NFT contract paused! Transaction: ${tx.hash}`)
}

async function unpauseNFT(luminaNFT) {
    console.log(`🔄 Unpausing NFT contract...`)
    const tx = await luminaNFT.unpause()
    await tx.wait()
    console.log(`✅ NFT contract unpaused! Transaction: ${tx.hash}`)
}

// Auction Contract Functions
async function setAuctionFee(luminaAuction, percent) {
    if (!percent || isNaN(percent)) {
        throw new Error("Invalid percentage")
    }

    const feeBps = Math.floor(parseFloat(percent) * 100)
    if (feeBps > 1000) {
        throw new Error("Fee cannot exceed 10%")
    }

    console.log(`🔄 Setting auction platform fee to: ${percent}%...`)
    const tx = await luminaAuction.setPlatformFee(feeBps)
    await tx.wait()
    console.log(`✅ Auction platform fee updated! Transaction: ${tx.hash}`)
}

async function withdrawAuctionFees(luminaAuction) {
    const balance = await ethers.provider.getBalance(LUMINA_AUCTION_ADDRESS)
    console.log(`💰 Auction Contract balance: ${ethers.formatEther(balance)} ETH`)

    if (balance === 0n) {
        console.log("❌ No fees to withdraw")
        return
    }

    console.log(`🔄 Withdrawing auction fees...`)
    const tx = await luminaAuction.withdrawPlatformFees()
    await tx.wait()
    console.log(`✅ Fees withdrawn! Transaction: ${tx.hash}`)
}

async function settleAuction(luminaAuction, auctionId) {
    if (!auctionId || isNaN(auctionId)) {
        throw new Error("Invalid auction ID")
    }

    console.log(`🔄 Settling auction ${auctionId}...`)
    const tx = await luminaAuction.settleAuction(auctionId)
    await tx.wait()
    console.log(`✅ Auction settled! Transaction: ${tx.hash}`)
}

async function pauseAuction(luminaAuction) {
    console.log(`🔄 Pausing auction contract...`)
    const tx = await luminaAuction.pause()
    await tx.wait()
    console.log(`✅ Auction contract paused! Transaction: ${tx.hash}`)
}

async function unpauseAuction(luminaAuction) {
    console.log(`🔄 Unpausing auction contract...`)
    const tx = await luminaAuction.unpause()
    await tx.wait()
    console.log(`✅ Auction contract unpaused! Transaction: ${tx.hash}`)
}

// Marketplace Contract Functions
async function setMarketplaceFee(luminaMarketplace, percent) {
    if (!percent || isNaN(percent)) {
        throw new Error("Invalid percentage")
    }

    const feeBps = Math.floor(parseFloat(percent) * 100)
    if (feeBps > 1000) {
        throw new Error("Fee cannot exceed 10%")
    }

    console.log(`🔄 Setting marketplace platform fee to: ${percent}%...`)
    const tx = await luminaMarketplace.setPlatformFee(feeBps)
    await tx.wait()
    console.log(`✅ Marketplace platform fee updated! Transaction: ${tx.hash}`)
}

async function withdrawMarketplaceFees(luminaMarketplace) {
    const balance = await ethers.provider.getBalance(LUMINA_MARKETPLACE_ADDRESS)
    console.log(`💰 Marketplace Contract balance: ${ethers.formatEther(balance)} ETH`)

    if (balance === 0n) {
        console.log("❌ No fees to withdraw")
        return
    }

    console.log(`🔄 Withdrawing marketplace fees...`)
    const tx = await luminaMarketplace.withdrawPlatformFees()
    await tx.wait()
    console.log(`✅ Fees withdrawn! Transaction: ${tx.hash}`)
}

async function pauseMarketplace(luminaMarketplace) {
    console.log(`🔄 Pausing marketplace contract...`)
    const tx = await luminaMarketplace.pause()
    await tx.wait()
    console.log(`✅ Marketplace contract paused! Transaction: ${tx.hash}`)
}

async function unpauseMarketplace(luminaMarketplace) {
    console.log(`🔄 Unpausing marketplace contract...`)
    const tx = await luminaMarketplace.unpause()
    await tx.wait()
    console.log(`✅ Marketplace contract unpaused! Transaction: ${tx.hash}`)
}

// Utility Functions
async function showStatus(luminaNFT, luminaAuction, luminaMarketplace) {
    console.log("📊 Contract Status Report")
    console.log("========================")

    try {
        // NFT Contract
        const mintFee = await luminaNFT.mintFee()
        const nftPaused = await luminaNFT.paused()
        const currentTokenId = await luminaNFT.getCurrentTokenId()
        const nftBalance = await ethers.provider.getBalance(LUMINA_NFT_ADDRESS)

        console.log("🎨 LuminaNFT Contract:")
        console.log(`  Address: ${LUMINA_NFT_ADDRESS}`)
        console.log(`  Current Token ID: ${currentTokenId}`)
        console.log(`  Mint Fee: ${ethers.formatEther(mintFee)} ETH`)
        console.log(`  Paused: ${nftPaused}`)
        console.log(`  Balance: ${ethers.formatEther(nftBalance)} ETH`)
        console.log("")

        // Auction Contract
        const auctionFee = await luminaAuction.platformFeeBps()
        const auctionPaused = await luminaAuction.paused()
        const currentAuctionId = await luminaAuction.getCurrentAuctionId()
        const auctionBalance = await ethers.provider.getBalance(LUMINA_AUCTION_ADDRESS)

        console.log("🏛️ LuminaAuction Contract:")
        console.log(`  Address: ${LUMINA_AUCTION_ADDRESS}`)
        console.log(`  Current Auction ID: ${currentAuctionId}`)
        console.log(`  Platform Fee: ${Number(auctionFee) / 100}%`)
        console.log(`  Paused: ${auctionPaused}`)
        console.log(`  Balance: ${ethers.formatEther(auctionBalance)} ETH`)
        console.log("")

        // Marketplace Contract
        const marketplaceFee = await luminaMarketplace.platformFeeBps()
        const marketplacePaused = await luminaMarketplace.paused()
        const currentListingId = await luminaMarketplace.getCurrentListingId()
        const totalVolume = await luminaMarketplace.totalVolume()
        const totalSales = await luminaMarketplace.totalSales()
        const marketplaceBalance = await ethers.provider.getBalance(LUMINA_MARKETPLACE_ADDRESS)

        console.log("🏪 LuminaMarketplace Contract:")
        console.log(`  Address: ${LUMINA_MARKETPLACE_ADDRESS}`)
        console.log(`  Current Listing ID: ${currentListingId}`)
        console.log(`  Platform Fee: ${Number(marketplaceFee) / 100}%`)
        console.log(`  Paused: ${marketplacePaused}`)
        console.log(`  Total Volume: ${ethers.formatEther(totalVolume)} ETH`)
        console.log(`  Total Sales: ${totalSales}`)
        console.log(`  Balance: ${ethers.formatEther(marketplaceBalance)} ETH`)
    } catch (error) {
        console.error(`❌ Error reading contract status: ${error.message}`)
    }
}

async function checkPendingAuctions(luminaAuction) {
    console.log("🔍 Checking for auctions that need settlement...")

    const currentAuctionId = await luminaAuction.getCurrentAuctionId()
    console.log(`Total auctions created: ${currentAuctionId}`)

    const pendingAuctions = []
    const currentTime = Math.floor(Date.now() / 1000)

    for (let i = 1; i <= currentAuctionId; i++) {
        try {
            const auction = await luminaAuction.auctions(i)

            if (auction.active && !auction.settled && auction.endTime < currentTime) {
                pendingAuctions.push({
                    id: i,
                    tokenId: auction.tokenId,
                    endTime: new Date(Number(auction.endTime) * 1000).toLocaleString(),
                    currentBid: ethers.formatEther(auction.currentBid),
                    currentBidder: auction.currentBidder,
                })
            }
        } catch (error) {
            // Skip invalid auctions
        }
    }

    if (pendingAuctions.length === 0) {
        console.log("✅ No auctions need settlement")
    } else {
        console.log(`⚠️  Found ${pendingAuctions.length} auction(s) that need settlement:`)
        pendingAuctions.forEach((auction) => {
            console.log(`  - Auction ${auction.id}: Token ${auction.tokenId}`)
            console.log(`    Ended: ${auction.endTime}`)
            console.log(`    Current Bid: ${auction.currentBid} ETH by ${auction.currentBidder}`)
        })
    }

    return pendingAuctions
}

async function settleAllPendingAuctions(luminaAuction) {
    console.log("🔄 Settling all pending auctions...")

    const pendingAuctions = await checkPendingAuctions(luminaAuction)

    if (pendingAuctions.length === 0) {
        return
    }

    for (const auction of pendingAuctions) {
        try {
            console.log(`🔄 Settling auction ${auction.id}...`)
            const tx = await luminaAuction.settleAuction(auction.id)
            await tx.wait()
            console.log(`✅ Auction ${auction.id} settled! Transaction: ${tx.hash}`)
        } catch (error) {
            console.error(`❌ Failed to settle auction ${auction.id}: ${error.message}`)
        }
    }
}

async function withdrawAllFees(luminaNFT, luminaAuction, luminaMarketplace) {
    console.log("💰 Withdrawing fees from all contracts...")

    // Withdraw NFT fees
    try {
        await withdrawNFTFees(luminaNFT)
    } catch (error) {
        console.error(`❌ Failed to withdraw NFT fees: ${error.message}`)
    }

    // Withdraw auction fees
    try {
        await withdrawAuctionFees(luminaAuction)
    } catch (error) {
        console.error(`❌ Failed to withdraw auction fees: ${error.message}`)
    }

    // Withdraw marketplace fees
    try {
        await withdrawMarketplaceFees(luminaMarketplace)
    } catch (error) {
        console.error(`❌ Failed to withdraw marketplace fees: ${error.message}`)
    }

    console.log("✅ Fee withdrawal process completed!")
}

// Error handling
process.on("unhandledRejection", (error) => {
    console.error("❌ Unhandled promise rejection:", error)
    process.exit(1)
})

main().catch((error) => {
    console.error("❌ Script failed:", error)
    process.exit(1)
})
