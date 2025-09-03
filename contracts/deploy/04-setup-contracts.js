const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { log, get } = deployments
    const { deployer } = await getNamedAccounts()

    log("----------------------------------------------------")
    log("Setting up contract connections...")
    log("Network:", network.name)
    log("Deployer:", deployer)

    // Get deployed contracts
    const luminaNFT = await get("LuminaNFT")
    const luminaAuction = await get("LuminaAuction")
    const luminaMarketplace = await get("LuminaMarketplace")

    log("Contract addresses:")
    log("LuminaNFT: ", luminaNFT.address)
    log("LuminaAuction: ", luminaAuction.address)
    log("LuminaMarketplace: ", luminaMarketplace.address)

    // Get contract instances
    const nftContract = await ethers.getContractAt("LuminaNFT", luminaNFT.address)
    const marketplaceContract = await ethers.getContractAt(
        "LuminaMarketplace",
        luminaMarketplace.address,
    )

    log("\n Configuring contract connections...")

    try {
        // Set marketplace contract in NFT contract
        const currentMarketplace = await nftContract.marketplaceContract()
        if (currentMarketplace !== luminaMarketplace.address) {
            log("Setting marketplace contract in NFT contract...")
            const setMarketplaceTx = await nftContract.setMarketplaceContract(
                luminaMarketplace.address,
            )
            await setMarketplaceTx.wait(1)
            log("Marketplace contract set in NFT contract")
        } else {
            log("Marketplace already set in NFT contract")
        }

        // Set auction contract in marketplace
        const currentAuction = await marketplaceContract.luminaAuctionContract()
        if (currentAuction !== luminaAuction.address) {
            log("Setting auction contract in marketplace...")
            const setAuctionTx = await marketplaceContract.setAuctionContract(luminaAuction.address)
            await setAuctionTx.wait(1)
            log("Auction contract set in marketplace")
        } else {
            log("Auction already set in marketplace")
        }

        log("\n Contract setup complete!")

        // Display final summary
        log("\n Deployment Summary:")
        log("=".repeat(50))
        log("LuminaNFT: ", luminaNFT.address)
        log("LuminaAuction: ", luminaAuction.address)
        log("LuminaMarketplace: ", luminaMarketplace.address)
        log("=".repeat(50))

        // Save deployment addresses to a JSON file
        const deploymentInfo = {
            network: network.name,
            chainId: network.config.chainId,
            deployer: deployer,
            contracts: {
                LuminaNFT: luminaNFT.address,
                LuminaAuction: luminaAuction.address,
                LuminaMarketplace: luminaMarketplace.address,
            },
            timestamp: new Date().toISOString(),
            blockNumbers: {
                LuminaNFT: luminaNFT.receipt?.blockNumber,
                LuminaAuction: luminaAuction.receipt?.blockNumber,
                LuminaMarketplace: luminaMarketplace.receipt?.blockNumber,
            },
        }

        const fs = require("fs")
        const deploymentPath = `deployments/${network.name}.json`
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2))
        log("Deployment info saved to:", deploymentPath)

        // Verification instructions
        if (!developmentChains.includes(network.name)) {
            log("\n To verify contracts manually, run:")
            log(`npx hardhat verify --network ${network.name} ${luminaNFT.address}`)
            log(
                `npx hardhat verify --network ${network.name} ${luminaAuction.address} ${luminaNFT.address}`,
            )
            log(
                `npx hardhat verify --network ${network.name} ${luminaMarketplace.address} ${luminaNFT.address}`,
            )
        }
    } catch (error) {
        log("❌ Error during contract setup:", error.message)
        throw error
    }

    log("----------------------------------------------------")
}

module.exports.tags = ["all", "setup"]
module.exports.dependencies = ["lumina-nft", "lumina-auction", "lumina-marketplace"]
