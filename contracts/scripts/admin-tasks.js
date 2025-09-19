const { task } = require("hardhat/config")

// Contract addresses from deployments
const LUMINA_NFT_ADDRESS = "0x1037CC8ddDB8aC25B2dcD5dA7815b6c94930A6DB"
const LUMINA_AUCTION_ADDRESS = "0x5DE7F272860556D8650a7916ca84F4Fc4aE089d3"
const LUMINA_MARKETPLACE_ADDRESS = "0xCa7680E1511f11BFb1c5BEc584246D8bd4C76d1F"

// Status task
task("admin:status", "Show status of all contracts").setAction(async (taskArgs, hre) => {
    const { ethers } = hre

    console.log("📊 Contract Status Report")
    console.log("========================")

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
})

// Settle auction task
task("admin:settle-auction", "Settle a specific auction")
    .addParam("id", "The auction ID to settle")
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre
        const auctionId = taskArgs.id

        console.log(`🔄 Settling auction ${auctionId}...`)

        const luminaAuction = await ethers.getContractAt("LuminaAuction", LUMINA_AUCTION_ADDRESS)

        try {
            const tx = await luminaAuction.settleAuction(auctionId)
            await tx.wait()
            console.log(`✅ Auction ${auctionId} settled! Transaction: ${tx.hash}`)
        } catch (error) {
            console.error(`❌ Failed to settle auction ${auctionId}: ${error.message}`)
        }
    })

// Check pending auctions task
task("admin:check-auctions", "Check for auctions that need settlement").setAction(
    async (taskArgs, hre) => {
        const { ethers } = hre

        console.log("🔍 Checking for auctions that need settlement...")

        const luminaAuction = await ethers.getContractAt("LuminaAuction", LUMINA_AUCTION_ADDRESS)
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
                console.log(
                    `    Current bid: ${auction.currentBid} ETH by ${auction.currentBidder}`,
                )
                console.log("")
            })
        }
    },
)

// Settle all pending auctions task
task("admin:settle-all", "Settle all pending auctions").setAction(async (taskArgs, hre) => {
    const { ethers } = hre

    console.log("🔄 Settling all pending auctions...")

    const luminaAuction = await ethers.getContractAt("LuminaAuction", LUMINA_AUCTION_ADDRESS)
    const currentAuctionId = await luminaAuction.getCurrentAuctionId()

    const pendingAuctions = []
    const currentTime = Math.floor(Date.now() / 1000)

    // Find pending auctions
    for (let i = 1; i <= currentAuctionId; i++) {
        try {
            const auction = await luminaAuction.auctions(i)
            if (auction.active && !auction.settled && Number(auction.endTime) < currentTime) {
                pendingAuctions.push(i)
            }
        } catch (error) {
            // Skip invalid auctions
        }
    }

    if (pendingAuctions.length === 0) {
        console.log("✅ No auctions need settlement")
        return
    }

    console.log(`Found ${pendingAuctions.length} auctions to settle`)

    let settledCount = 0
    let failedCount = 0

    for (const auctionId of pendingAuctions) {
        try {
            console.log(`🔄 Settling auction ${auctionId}...`)
            const tx = await luminaAuction.settleAuction(auctionId)
            await tx.wait()
            console.log(`✅ Auction ${auctionId} settled! Transaction: ${tx.hash}`)
            settledCount++

            // Small delay between settlements
            await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (error) {
            console.error(`❌ Failed to settle auction ${auctionId}: ${error.message}`)
            failedCount++
        }
    }

    console.log(`\n📊 Settlement Summary:`)
    console.log(`✅ Successfully settled: ${settledCount}`)
    console.log(`❌ Failed to settle: ${failedCount}`)
})

// Verify creator task
task("admin:verify-creator", "Verify a creator")
    .addParam("address", "The creator address to verify")
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre
        const creatorAddress = taskArgs.address

        if (!ethers.isAddress(creatorAddress)) {
            console.log("❌ Invalid address format")
            return
        }

        console.log(`🔄 Verifying creator: ${creatorAddress}...`)

        const luminaNFT = await ethers.getContractAt("LuminaNFT", LUMINA_NFT_ADDRESS)

        try {
            const tx = await luminaNFT.verifyCreator(creatorAddress)
            await tx.wait()
            console.log(`✅ Creator verified! Transaction: ${tx.hash}`)
        } catch (error) {
            console.error(`❌ Failed to verify creator: ${error.message}`)
        }
    })

// Set mint fee task
task("admin:set-mint-fee", "Set the mint fee")
    .addParam("fee", "The mint fee in ETH")
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre
        const feeInEth = taskArgs.fee

        if (isNaN(feeInEth)) {
            console.log("❌ Invalid fee amount")
            return
        }

        const feeInWei = ethers.parseEther(feeInEth)
        console.log(`🔄 Setting mint fee to: ${feeInEth} ETH...`)

        const luminaNFT = await ethers.getContractAt("LuminaNFT", LUMINA_NFT_ADDRESS)

        try {
            const tx = await luminaNFT.setMintFee(feeInWei)
            await tx.wait()
            console.log(`✅ Mint fee updated! Transaction: ${tx.hash}`)
        } catch (error) {
            console.error(`❌ Failed to set mint fee: ${error.message}`)
        }
    })

// Withdraw all fees task
task("admin:withdraw-all", "Withdraw fees from all contracts").setAction(async (taskArgs, hre) => {
    const { ethers } = hre

    console.log("💰 Withdrawing fees from all contracts...")

    const luminaNFT = await ethers.getContractAt("LuminaNFT", LUMINA_NFT_ADDRESS)
    const luminaAuction = await ethers.getContractAt("LuminaAuction", LUMINA_AUCTION_ADDRESS)
    const luminaMarketplace = await ethers.getContractAt(
        "LuminaMarketplace",
        LUMINA_MARKETPLACE_ADDRESS,
    )

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
})

// Pause/Unpause tasks
task("admin:pause-nft", "Pause the NFT contract").setAction(async (taskArgs, hre) => {
    const { ethers } = hre
    const luminaNFT = await ethers.getContractAt("LuminaNFT", LUMINA_NFT_ADDRESS)

    try {
        const tx = await luminaNFT.pause()
        await tx.wait()
        console.log(`✅ NFT contract paused! Transaction: ${tx.hash}`)
    } catch (error) {
        console.error(`❌ Failed to pause NFT contract: ${error.message}`)
    }
})

task("admin:unpause-nft", "Unpause the NFT contract").setAction(async (taskArgs, hre) => {
    const { ethers } = hre
    const luminaNFT = await ethers.getContractAt("LuminaNFT", LUMINA_NFT_ADDRESS)

    try {
        const tx = await luminaNFT.unpause()
        await tx.wait()
        console.log(`✅ NFT contract unpaused! Transaction: ${tx.hash}`)
    } catch (error) {
        console.error(`❌ Failed to unpause NFT contract: ${error.message}`)
    }
})

module.exports = {}
