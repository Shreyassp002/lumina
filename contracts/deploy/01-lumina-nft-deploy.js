const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    log("----------------------------------------------------")
    log("Deploying LuminaNFT...")
    log("Network:", network.name)
    log("Chain ID:", chainId)
    log("Deployer:", deployer)

    const args = []

    const luminaNFT = await deploy("LuminaNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[chainId]?.blockConfirmations || 1,
    })

    log(`LuminaNFT deployed to: ${luminaNFT.address}`)

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying contract...")
        await verify(luminaNFT.address, args)
    }

    log("----------------------------------------------------")
}

module.exports.tags = ["all", "nft", "lumina-nft"]
