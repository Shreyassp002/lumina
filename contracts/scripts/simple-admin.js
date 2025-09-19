const { ethers } = require("hardhat")
require("dotenv").config()

// Contract addresses from deployments
const LUMINA_NFT_ADDRESS = "0x1037CC8ddDB8aC25B2dcD5dA7815b6c94930A6DB"
const LUMINA_AUCTION_ADDRESS = "0x5DE7F272860556D8650a7916ca84F4Fc4aE089d3"
const LUMINA_MARKETPLACE_ADDRESS = "0xCa7680E1511f11BFb1c5BEc584246D8bd4C76d1F"

async function main() {
    console.log("⚡ Lumina Simple Admin Script")
    console.log("=============================")

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

    // Check what action to perform based on environment variable or default to status
    const action = process.env.ADMIN_ACTION || "status"
    const param1 = process.env.ADMIN_PARAM1
    const param2 = process.env.ADMIN_PARAM2

    console.log(`🔧 Performing action: ${action}`)
    if (param1) console.log(`📝 Parameter 1: ${param1}`)
    if (param2) console.log(`📝 Parameter 2: ${param2}`)
    console.log("")

    try {
        switch (action.toLowerCase()) {
            case "status":
                await showStatus(luminaNFT, luminaAuction, luminaMarketplace)
                break
            case "check-auctions":
                await checkPendingAuctions(luminaAuction)
                break
            case "settle-auction":
                if (!param1) throw new Error("Auction ID required (set ADMIN_PARAM1)")
                await settleAuction(luminaAuction, param1)
                break
            case "settle-all":
                await settleAllPendingAuctions(luminaAuction)
                break
            case "verify-creator":
                if (!param1) throw new Error("Creator address required (set ADMIN_PARAM1)")
                await verifyCreator(luminaNFT, param1)
                break
            case "set-mint-fee":
                if (!param1) throw new Error("Fee amount required (set ADMIN_PARAM1)")
                await setMintFee(luminaNFT, param1)
                break
            case "withdraw-all":
                await withdrawAllFees(luminaNFT, luminaAuction, luminaMarketplace)
                break
            case "pause-nft":
                await pauseNFT(luminaNFT)
                break
            case "unpause-nft":
                await unpauseNFT(luminaNFT)
                break
            case "pause-auction":
                await pauseAuction(luminaAuction)
                break
            case "unpause-auction":
                await unpauseAuction(luminaAuction)
                break
            case "pause-marketplace":
                await pauseMarketplace(luminaMarketplace)
                break
            case "unpause-marketplace":
                await unpauseMarketplace(luminaMarketplace)
                break
            default:
                console.log(`❌ Unknown action: ${action}`)
                showUsage()
        }
    } catch (error) {
        console.error(`❌ Error executing ${action}:`, error.message)
    }
}

function showUsage() {
    console.log("📖 Usage: Set environment variables and run the script")
    console.log("")
    console.log("Environment Variables:")
    console.log("  ADMIN_ACTION - The action to perform")
    console.log("  ADMIN_PARAM1 - First parameter (if needed)")
    console.log("  ADMIN_PARAM2 - Second parameter (if needed)")
    console.log("")
    console.log("Available Actions:")
    console.log("  status           - Show contract status")
    console.log("  check-auctions   - Check pending auctions")
    console.log("  settle-auction   - Settle specific auction (needs ADMIN_PARAM1=auctionId)")
    console.log("  settle-all       - Settle all pending auctions")
    console.log("  verify-creator   - Verify creator (needs ADMIN_PARAM1=address)")
    console.log("  set-mint-fee     - Set mint fee (needs ADMIN_PARAM1=ethAmount)")
    console.log("  withdraw-all     - Withdraw all fees")
    console.log("  pause-nft        - Pause NFT contract")
    console.log("  unpause-nft      - Unpause NFT contract")
    console.log("  pause-auction    - Pause auction contract")
    console.log("  unpause-auction  - Unpause auction contract")
    console.log("  pause-marketplace - Pause marketplace contract")
    console.log("  unpause-marketplace - Unpause marketplace contract")
    console.log("")
    console.log("Examples:")
    console.log(
        "  ADMIN_ACTION=status npx hardhat run scripts/simple-admin.js --network somniaTestnet",
    )
    console.log(
        "  ADMIN_ACTION=settle-auction ADMIN_PARAM1=1 npx hardhat run scripts/simple-admin.js --network somniaTestnet",
    )
    console.log(
        "  ADMIN_ACTION=verify-creator ADMIN_PARAM1=0x1234... npx hardhat run scripts/simple-admin.js --network somniaTestnet",
    )
}

// Implementation functions
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

            if (auction.active && !auction.settled && Number(auction.endTime) < currentTime) {
                const auctionInfo = {
                    id: i,
                    tokenId: Number(auction.tokenId),
                    endTime: new Date(Number(auction.endTime) * 1000).toLocaleString(),
                    currentBid: ethers.formatEther(auction.currentBid),
                    currentBidder: auction.currentBidder,
                    hoursOverdue: Math.floor((currentTime - Number(auction.endTime)) / 3600),
                }

                pendingAuctions.push(auctionInfo)
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
            console.log(`    Hours overdue: ${auction.hoursOverdue}`)
            console.log(`    Current bid: ${auction.currentBid} ETH by ${auction.currentBidder}`)
            console.log("")
        })
    }

    return pendingAuctions
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

async function settleAllPendingAuctions(luminaAuction) {
    console.log("🔄 Settling all pending auctions...")

    const pendingAuctions = await checkPendingAuctions(luminaAuction)

    if (pendingAuctions.length === 0) {
        return
    }

    let settledCount = 0
    let failedCount = 0

    for (const auction of pendingAuctions) {
        try {
            console.log(`🔄 Settling auction ${auction.id}...`)
            const tx = await luminaAuction.settleAuction(auction.id)
            await tx.wait()
            console.log(`✅ Auction ${auction.id} settled! Transaction: ${tx.hash}`)
            settledCount++

            // Small delay between settlements
            await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (error) {
            console.error(`❌ Failed to settle auction ${auction.id}: ${error.message}`)
            failedCount++
        }
    }

    console.log(`\n📊 Settlement Summary:`)
    console.log(`✅ Successfully settled: ${settledCount}`)
    console.log(`❌ Failed to settle: ${failedCount}`)
}

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

async function withdrawAllFees(luminaNFT, luminaAuction, luminaMarketplace) {
    console.log("💰 Withdrawing fees from all contracts...")

    // Withdraw NFT fees
    try {
        const nftBalance = await ethers.provider.getBalance(LUMINA_NFT_ADDRESS)
        if (nftBalance > 0n) {
            console.log(`🔄 Withdrawing NFT fees: ${ethers.formatEther(nftBalance)} ETH...`)
            const tx = await luminaNFT.withdrawFees()
            await tx.wait()
            console.log(`✅ NFT fees withdrawn! Transaction: ${tx.hash}`)
        } else {
            console.log("ℹ️  No NFT fees to withdraw")
        }
    } catch (error) {
        console.error(`❌ Failed to withdraw NFT fees: ${error.message}`)
    }

    // Withdraw auction fees
    try {
        const auctionBalance = await ethers.provider.getBalance(LUMINA_AUCTION_ADDRESS)
        if (auctionBalance > 0n) {
            console.log(`🔄 Withdrawing auction fees: ${ethers.formatEther(auctionBalance)} ETH...`)
            const tx = await luminaAuction.withdrawPlatformFees()
            await tx.wait()
            console.log(`✅ Auction fees withdrawn! Transaction: ${tx.hash}`)
        } else {
            console.log("ℹ️  No auction fees to withdraw")
        }
    } catch (error) {
        console.error(`❌ Failed to withdraw auction fees: ${error.message}`)
    }

    // Withdraw marketplace fees
    try {
        const marketplaceBalance = await ethers.provider.getBalance(LUMINA_MARKETPLACE_ADDRESS)
        if (marketplaceBalance > 0n) {
            console.log(
                `🔄 Withdrawing marketplace fees: ${ethers.formatEther(marketplaceBalance)} ETH...`,
            )
            const tx = await luminaMarketplace.withdrawPlatformFees()
            await tx.wait()
            console.log(`✅ Marketplace fees withdrawn! Transaction: ${tx.hash}`)
        } else {
            console.log("ℹ️  No marketplace fees to withdraw")
        }
    } catch (error) {
        console.error(`❌ Failed to withdraw marketplace fees: ${error.message}`)
    }

    console.log("✅ Fee withdrawal process completed!")
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

main().catch((error) => {
    console.error("❌ Script failed:", error)
    process.exit(1)
})
