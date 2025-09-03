const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("----------------------------------------------------")
    log("🚀 Deploying LuminaAuction...")
    log("📍 Network:", network.name)
    log("🔗 Chain ID:", chainId)
    log("👤 Deployer:", deployer)

    // Get the previously deployed LuminaNFT contract
    const luminaNFT = await get("LuminaNFT")
    log("🔗 Using LuminaNFT at:", luminaNFT.address)

    const args = [luminaNFT.address]

    const luminaAuction = await deploy("LuminaAuction", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[chainId]?.blockConfirmations || 1,
    })

    log(`✅ LuminaAuction deployed to: ${luminaAuction.address}`)

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("🔍 Verifying contract...")
        await verify(luminaAuction.address, args)
    }

    log("----------------------------------------------------")
}

module.exports.tags = ["all", "auction", "lumina-auction"]
module.exports.dependencies = ["lumina-nft"]
