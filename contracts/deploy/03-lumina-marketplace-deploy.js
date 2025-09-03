const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("----------------------------------------------------")
    log("Deploying LuminaMarketplace...")
    log("Network:", network.name)
    log("Chain ID:", chainId)
    log("Deployer:", deployer)

    // Get deployed LuminaNFT contract
    const luminaNFT = await get("LuminaNFT")
    log("Using LuminaNFT at:", luminaNFT.address)

    const args = [luminaNFT.address]

    const luminaMarketplace = await deploy("LuminaMarketplace", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[chainId]?.blockConfirmations || 1,
    })

    log(`LuminaMarketplace deployed to: ${luminaMarketplace.address}`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying contract...")
        await verify(luminaMarketplace.address, args)
    }

    log("----------------------------------------------------")
}

module.exports.tags = ["all", "marketplace", "lumina-marketplace"]
module.exports.dependencies = ["lumina-nft"]
