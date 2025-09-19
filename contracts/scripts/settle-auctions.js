const { ethers } = require("hardhat")
require("dotenv").config()

// Contract addresses from deployments
const LUMINA_AUCTION_ADDRESS = "0x5DE7F272860556D8650a7916ca84F4Fc4aE089d3"

async function main() {
    console.log("🏛️ Auction Settlement Bot")
    console.log("=========================")
    console.log(`Timestamp: ${new Date().toISOString()}`)

    // Get signer (admin account)
    const [admin] = await ethers.getSigners()
    console.log(`Admin address: ${admin.address}`)

    // Get auction contract instance
    const luminaAuction = await ethers.getContractAt("LuminaAuction", LUMINA_AUCTION_ADDRESS)

    try {
        // Check for pending auctions
        const pendingAuctions = await findPendingAuctions(luminaAuction)

        if (pendingAuctions.length === 0) {
            console.log("✅ No auctions need settlement")
            return
        }

        console.log(`⚠️  Found ${pendingAuctions.length} auction(s) that need settlement`)

        // Settle each pending auction
        let settledCount = 0
        let failedCount = 0

        for (const auction of pendingAuctions) {
            try {
                console.log(`🔄 Settling auction ${auction.id} (Token ${auction.tokenId})...`)

                const tx = await luminaAuction.settleAuction(auction.id, {
                    gasLimit: 500000, // Set reasonable gas limit
                })

                const receipt = await tx.wait()
                console.log(`✅ Auction ${auction.id} settled! Gas used: ${receipt.gasUsed}`)
                console.log(`   Transaction: ${tx.hash}`)

                settledCount++

                // Small delay between settlements to avoid nonce issues
                await new Promise((resolve) => setTimeout(resolve, 2000))
            } catch (error) {
                console.error(`❌ Failed to settle auction ${auction.id}:`)
                console.error(`   Error: ${error.message}`)
                if (error.reason) {
                    console.error(`   Reason: ${error.reason}`)
                }
                failedCount++
            }
        }

        console.log("\n📊 Settlement Summary:")
        console.log(`✅ Successfully settled: ${settledCount}`)
        console.log(`❌ Failed to settle: ${failedCount}`)
        console.log(`📈 Total processed: ${pendingAuctions.length}`)
    } catch (error) {
        console.error("❌ Critical error in settlement process:", error.message)
        process.exit(1)
    }
}

async function findPendingAuctions(luminaAuction) {
    console.log("🔍 Scanning for auctions that need settlement...")

    const currentAuctionId = await luminaAuction.getCurrentAuctionId()
    console.log(`Total auctions created: ${currentAuctionId}`)

    const pendingAuctions = []
    const currentTime = Math.floor(Date.now() / 1000)

    // Check each auction
    for (let i = 1; i <= currentAuctionId; i++) {
        try {
            const auction = await luminaAuction.auctions(i)

            // Check if auction needs settlement
            if (auction.active && !auction.settled && Number(auction.endTime) < currentTime) {
                const auctionInfo = {
                    id: i,
                    tokenId: Number(auction.tokenId),
                    seller: auction.seller,
                    endTime: new Date(Number(auction.endTime) * 1000).toISOString(),
                    currentBid: ethers.formatEther(auction.currentBid),
                    currentBidder: auction.currentBidder,
                    hoursOverdue: Math.floor((currentTime - Number(auction.endTime)) / 3600),
                }

                pendingAuctions.push(auctionInfo)

                console.log(`📋 Pending Auction ${i}:`)
                console.log(`   Token ID: ${auctionInfo.tokenId}`)
                console.log(`   Ended: ${auctionInfo.endTime}`)
                console.log(`   Hours overdue: ${auctionInfo.hoursOverdue}`)
                console.log(`   Current bid: ${auctionInfo.currentBid} ETH`)
                console.log(`   Bidder: ${auctionInfo.currentBidder}`)
                console.log("")
            }
        } catch (error) {
            // Skip invalid auctions (they might not exist)
            if (!error.message.includes("does not exist")) {
                console.warn(`⚠️  Warning: Could not read auction ${i}: ${error.message}`)
            }
        }
    }

    return pendingAuctions
}

// Enhanced error handling
process.on("unhandledRejection", (error) => {
    console.error("❌ Unhandled promise rejection:", error)
    process.exit(1)
})

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught exception:", error)
    process.exit(1)
})

// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\n👋 Received SIGINT, shutting down gracefully...")
    process.exit(0)
})

process.on("SIGTERM", () => {
    console.log("\n👋 Received SIGTERM, shutting down gracefully...")
    process.exit(0)
})

main().catch((error) => {
    console.error("❌ Settlement bot failed:", error)
    process.exit(1)
})
