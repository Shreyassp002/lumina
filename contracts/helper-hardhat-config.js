const { ethers } = require("hardhat")

const networkConfig = {
    11155111: {
        name: "sepolia",
    },
    50311: {
        name: "somniaTestnet",
        blockConfirmations: 3,
    },
    31337: {
        name: "hardhat",
    },
}

const developmentChains = ["hardhat", "localhost"]
const testnetChains = ["sepolia", "somniaTestnet"]

module.exports = {
    networkConfig,
    developmentChains,
    testnetChains,
}
