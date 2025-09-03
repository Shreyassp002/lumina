require("@nomicfoundation/hardhat-chai-matchers")
require("hardhat-deploy")
// require("@nomicfoundation/hardhat-verify") // Will add when needed
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const SOMNIA_TESTNET_RPC_URL = process.env.SOMNIA_TESTNET_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    viaIR: true,
                },
            },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        somniaTestnet: {
            url: SOMNIA_TESTNET_RPC_URL || "https://dream-rpc.somnia.network",
            accounts: [PRIVATE_KEY],
            chainId: 50311,
            blockConfirmations: 3,
            gasPrice: 1000000000, // 1 gwei
            timeout: 60000,
        },
        somniaDevnet: {
            url: "https://dream-rpc.somnia.network",
            accounts: [PRIVATE_KEY],
            chainId: 50311,
            blockConfirmations: 1,
            gasPrice: 1000000000, // 1 gwei
            timeout: 60000,
        },
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localHost: {
            url: "http://127.0.0.1:8545/",
            //accounts: hardhat handles this
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    sourcify: {
        // Disabled by default
        // Doesn't need an API key
        enabled: true,
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        // coinmarketcap: COINMARKET_API_KEY
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    mocha: {
        timeout: 300000,
    },
}
