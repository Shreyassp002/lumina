const { ethers } = require("hardhat")
require("dotenv").config()

// Contract addresses from deployments
const LUMINA_NFT_ADDRESS = "0x1037CC8ddDB8aC25B2dcD5dA7815b6c94930A6DB"
const LUMINA_AUCTION_ADDRESS = "0x5DE7F272860556D8650a7916ca84F4Fc4aE089d3"
const LUMINA_MARKETPLACE_ADDRESS = "0xCa7680E1511f11BFb1c5BEc584246D8bd4C76d1F"

async function main() {
    console.log("🚀 Lumina Admin Functions Script")
    console.log("================================")

    // Get signer (admin account)
    const [admin] = await ethers.getSigners()
    console.log(`Admin address: ${admin.address}`)
    console.log(
        `Admin balance: ${ethers.formatEther(await admin.provider.getBalance(admin.address))} ETH`,
    )
    console.log("")

    // Get contract instances
    const luminaNFT = await ethers.getContractAt("LuminaNFT", LUMINA_NFT_ADDRESS)
    const luminaAuction = await ethers.getContractAt("LuminaAuction", LUMINA_AUCTION_ADDRESS)
    const luminaMarketplace = await ethers.getContractAt(
        "LuminaMarketplace",
        LUMINA_MARKETPLACE_ADDRESS,
    )

    // Verify we're the owner
    const nftOwner = await luminaNFT.owner()
    const auctionOwner = await luminaAuction.owner()
    const marketplaceOwner = await luminaMarketplace.owner()

    console.log("📋 Contract Ownership Status:")
    console.log(`NFT Contract Owner: ${nftOwner}`)
    console.log(`Auction Contract Owner: ${auctionOwner}`)
    console.log(`Marketplace Contract Owner: ${marketplaceOwner}`)
    console.log(
        `Admin is owner: ${admin.address === nftOwner && admin.address === auctionOwner && admin.address === marketplaceOwner}`,
    )
    console.log("")

    // Display current contract states
    await displayContractStates(luminaNFT, luminaAuction, luminaMarketplace)

    // Menu system
    await showMenu(luminaNFT, luminaAuction, luminaMarketplace, admin)
}

async function displayContractStates(luminaNFT, luminaAuction, luminaMarketplace) {
    console.log("📊 Current Contract States:")
    console.log("---------------------------")

    try {
        // NFT Contract State
        const mintFee = await luminaNFT.mintFee()
        const nftPaused = await luminaNFT.paused()
        const currentTokenId = await luminaNFT.getCurrentTokenId()

        console.log("🎨 LuminaNFT:")
        console.log(`  - Current Token ID: ${currentTokenId}`)
        console.log(`  - Mint Fee: ${ethers.formatEther(mintFee)} ETH`)
        console.log(`  - Paused: ${nftPaused}`)
        console.log(
            `  - Contract Balance: ${ethers.formatEther(await ethers.provider.getBalance(LUMINA_NFT_ADDRESS))} ETH`,
        )

        // Auction Contract State
        const auctionPlatformFee = await luminaAuction.platformFeeBps()
        const auctionPaused = await luminaAuction.paused()
        const currentAuctionId = await luminaAuction.getCurrentAuctionId()

        console.log("🏛️ LuminaAuction:")
        console.log(`  - Current Auction ID: ${currentAuctionId}`)
        console.log(`  - Platform Fee: ${auctionPlatformFee / 100}%`)
        console.log(`  - Paused: ${auctionPaused}`)
        console.log(
            `  - Contract Balance: ${ethers.formatEther(await ethers.provider.getBalance(LUMINA_AUCTION_ADDRESS))} ETH`,
        )

        // Marketplace Contract State
        const marketplacePlatformFee = await luminaMarketplace.platformFeeBps()
        const marketplacePaused = await luminaMarketplace.paused()
        const currentListingId = await luminaMarketplace.getCurrentListingId()
        const totalVolume = await luminaMarketplace.totalVolume()
        const totalSales = await luminaMarketplace.totalSales()

        console.log("🏪 LuminaMarketplace:")
        console.log(`  - Current Listing ID: ${currentListingId}`)
        console.log(`  - Platform Fee: ${marketplacePlatformFee / 100}%`)
        console.log(`  - Paused: ${marketplacePaused}`)
        console.log(`  - Total Volume: ${ethers.formatEther(totalVolume)} ETH`)
        console.log(`  - Total Sales: ${totalSales}`)
        console.log(
            `  - Contract Balance: ${ethers.formatEther(await ethers.provider.getBalance(LUMINA_MARKETPLACE_ADDRESS))} ETH`,
        )
    } catch (error) {
        console.log(`❌ Error reading contract states: ${error.message}`)
    }
    console.log("")
}

async function showMenu(luminaNFT, luminaAuction, luminaMarketplace, admin) {
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const question = (prompt) => new Promise((resolve) => readline.question(prompt, resolve))

    while (true) {
        console.log("🔧 Admin Functions Menu:")
        console.log("========================")
        console.log("NFT Contract Functions:")
        console.log("  1. Verify Creator")
        console.log("  2. Set Marketplace Contract")
        console.log("  3. Set Mint Fee")
        console.log("  4. Withdraw NFT Fees")
        console.log("  5. Pause/Unpause NFT Contract")
        console.log("")
        console.log("Auction Contract Functions:")
        console.log("  6. Set Auction Platform Fee")
        console.log("  7. Withdraw Auction Fees")
        console.log("  8. Settle Auction")
        console.log("  9. Pause/Unpause Auction Contract")
        console.log("")
        console.log("Marketplace Contract Functions:")
        console.log("  10. Set Auction Contract Address")
        console.log("  11. Set Marketplace Platform Fee")
        console.log("  12. Withdraw Marketplace Fees")
        console.log("  13. Pause/Unpause Marketplace Contract")
        console.log("")
        console.log("Utility Functions:")
        console.log("  14. Refresh Contract States")
        console.log("  15. Check Pending Auctions")
        console.log("  0. Exit")
        console.log("")

        const choice = await question("Select an option (0-15): ")

        try {
            switch (choice) {
                case "1":
                    await verifyCreator(luminaNFT, question)
                    break
                case "2":
                    await setMarketplaceContract(luminaNFT, question)
                    break
                case "3":
                    await setMintFee(luminaNFT, question)
                    break
                case "4":
                    await withdrawNFTFees(luminaNFT)
                    break
                case "5":
                    await toggleNFTPause(luminaNFT)
                    break
                case "6":
                    await setAuctionPlatformFee(luminaAuction, question)
                    break
                case "7":
                    await withdrawAuctionFees(luminaAuction)
                    break
                case "8":
                    await settleAuction(luminaAuction, question)
                    break
                case "9":
                    await toggleAuctionPause(luminaAuction)
                    break
                case "10":
                    await setAuctionContractAddress(luminaMarketplace, question)
                    break
                case "11":
                    await setMarketplacePlatformFee(luminaMarketplace, question)
                    break
                case "12":
                    await withdrawMarketplaceFees(luminaMarketplace)
                    break
                case "13":
                    await toggleMarketplacePause(luminaMarketplace)
                    break
                case "14":
                    await displayContractStates(luminaNFT, luminaAuction, luminaMarketplace)
                    break
                case "15":
                    await checkPendingAuctions(luminaAuction)
                    break
                case "0":
                    console.log("👋 Goodbye!")
                    readline.close()
                    return
                default:
                    console.log("❌ Invalid option. Please try again.")
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`)
        }

        console.log("\n" + "=".repeat(50) + "\n")
    }
}

// NFT Contract Functions
async function verifyCreator(luminaNFT, question) {
    const creatorAddress = await question("Enter creator address to verify: ")

    if (!ethers.isAddress(creatorAddress)) {
        console.log("❌ Invalid address format")
        return
    }

    console.log(`🔄 Verifying creator: ${creatorAddress}...`)
    const tx = await luminaNFT.verifyCreator(creatorAddress)
    await tx.wait()
    console.log(`✅ Creator verified! Transaction: ${tx.hash}`)
}

async function setMarketplaceContract(luminaNFT, question) {
    const marketplaceAddress = await question(
        `Enter marketplace contract address (current: ${LUMINA_MARKETPLACE_ADDRESS}): `,
    )

    if (!ethers.isAddress(marketplaceAddress)) {
        console.log("❌ Invalid address format")
        return
    }

    console.log(`🔄 Setting marketplace contract to: ${marketplaceAddress}...`)
    const tx = await luminaNFT.setMarketplaceContract(marketplaceAddress)
    await tx.wait()
    console.log(`✅ Marketplace contract updated! Transaction: ${tx.hash}`)
}

async function setMintFee(luminaNFT, question) {
    const feeInEth = await question("Enter new mint fee in ETH: ")
    const feeInWei = ethers.parseEther(feeInEth)

    console.log(`🔄 Setting mint fee to: ${feeInEth} ETH...`)
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

async function toggleNFTPause(luminaNFT) {
    const isPaused = await luminaNFT.paused()
    const action = isPaused ? "unpause" : "pause"

    console.log(`🔄 ${action.charAt(0).toUpperCase() + action.slice(1)}ing NFT contract...`)
    const tx = isPaused ? await luminaNFT.unpause() : await luminaNFT.pause()
    await tx.wait()
    console.log(`✅ NFT contract ${action}d! Transaction: ${tx.hash}`)
}

// Auction Contract Functions
async function setAuctionPlatformFee(luminaAuction, question) {
    const feePercent = await question("Enter new platform fee percentage (e.g., 2.5 for 2.5%): ")
    const feeBps = Math.floor(parseFloat(feePercent) * 100)

    if (feeBps > 1000) {
        console.log("❌ Fee cannot exceed 10%")
        return
    }

    console.log(`🔄 Setting auction platform fee to: ${feePercent}%...`)
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

async function settleAuction(luminaAuction, question) {
    const auctionId = await question("Enter auction ID to settle: ")

    if (!auctionId || isNaN(auctionId)) {
        console.log("❌ Invalid auction ID")
        return
    }

    console.log(`🔄 Settling auction ${auctionId}...`)
    const tx = await luminaAuction.settleAuction(auctionId)
    await tx.wait()
    console.log(`✅ Auction settled! Transaction: ${tx.hash}`)
}

async function toggleAuctionPause(luminaAuction) {
    const isPaused = await luminaAuction.paused()
    const action = isPaused ? "unpause" : "pause"

    console.log(`🔄 ${action.charAt(0).toUpperCase() + action.slice(1)}ing auction contract...`)
    const tx = isPaused ? await luminaAuction.unpause() : await luminaAuction.pause()
    await tx.wait()
    console.log(`✅ Auction contract ${action}d! Transaction: ${tx.hash}`)
}

// Marketplace Contract Functions
async function setAuctionContractAddress(luminaMarketplace, question) {
    const auctionAddress = await question(
        `Enter auction contract address (current: ${LUMINA_AUCTION_ADDRESS}): `,
    )

    if (!ethers.isAddress(auctionAddress)) {
        console.log("❌ Invalid address format")
        return
    }

    console.log(`🔄 Setting auction contract to: ${auctionAddress}...`)
    const tx = await luminaMarketplace.setAuctionContract(auctionAddress)
    await tx.wait()
    console.log(`✅ Auction contract updated! Transaction: ${tx.hash}`)
}

async function setMarketplacePlatformFee(luminaMarketplace, question) {
    const feePercent = await question("Enter new platform fee percentage (e.g., 2.5 for 2.5%): ")
    const feeBps = Math.floor(parseFloat(feePercent) * 100)

    if (feeBps > 1000) {
        console.log("❌ Fee cannot exceed 10%")
        return
    }

    console.log(`🔄 Setting marketplace platform fee to: ${feePercent}%...`)
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

async function toggleMarketplacePause(luminaMarketplace) {
    const isPaused = await luminaMarketplace.paused()
    const action = isPaused ? "unpause" : "pause"

    console.log(`🔄 ${action.charAt(0).toUpperCase() + action.slice(1)}ing marketplace contract...`)
    const tx = isPaused ? await luminaMarketplace.unpause() : await luminaMarketplace.pause()
    await tx.wait()
    console.log(`✅ Marketplace contract ${action}d! Transaction: ${tx.hash}`)
}

// Utility Functions
async function checkPendingAuctions(luminaAuction) {
    console.log("🔍 Checking for auctions that need settlement...")

    const currentAuctionId = await luminaAuction.getCurrentAuctionId()
    console.log(`Total auctions created: ${currentAuctionId}`)

    const pendingAuctions = []

    for (let i = 1; i <= currentAuctionId; i++) {
        try {
            const auction = await luminaAuction.auctions(i)
            const currentTime = Math.floor(Date.now() / 1000)

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
            console.log(
                `  - Auction ${auction.id}: Token ${auction.tokenId}, Ended: ${auction.endTime}`,
            )
            console.log(`    Current Bid: ${auction.currentBid} ETH by ${auction.currentBidder}`)
        })
    }
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
