const { ethers } = require("hardhat")

async function main() {
    console.log("🎨 Minting a random NFT on Somnia testnet...\n")

    // Contract address from deployment
    const LUMINA_NFT_ADDRESS = "0x1037CC8ddDB8aC25B2dcD5dA7815b6c94930A6DB"

    // Get signer
    const [signer] = await ethers.getSigners()
    console.log("Minting from account:", signer.address)

    // Get contract instance
    const LuminaNFT = await ethers.getContractFactory("LuminaNFT")
    const luminaNFT = LuminaNFT.attach(LUMINA_NFT_ADDRESS)

    // Check current balance
    const balance = await ethers.provider.getBalance(signer.address)
    console.log("Account balance:", ethers.formatEther(balance), "STT")

    // Get current mint fee
    const mintFee = await luminaNFT.mintFee()
    console.log("Mint fee:", ethers.formatEther(mintFee), "STT")

    // Random NFT metadata
    const randomId = Math.floor(Math.random() * 10000)
    const categories = ["Digital Art", "Photography", "3D Art", "Abstract", "Portrait", "Landscape"]
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]

    const nftMetadata = {
        metadataURI: `https://ipfs.io/ipfs/QmRandomHash${randomId}`, // Mock IPFS URI
        royaltyBps: 500, // 5% royalty
        category: randomCategory,
    }

    console.log("\n NFT Details:")
    console.log("- Metadata URI:", nftMetadata.metadataURI)
    console.log("- Category:", nftMetadata.category)
    console.log("- Royalty:", nftMetadata.royaltyBps / 100, "%")

    try {
        // Get current token counter before minting
        const currentTokenId = await luminaNFT.getCurrentTokenId()
        const nextTokenId = currentTokenId + 1n

        console.log("\n Minting NFT...")
        console.log("Next token ID will be:", nextTokenId.toString())

        // Mint the NFT
        const tx = await luminaNFT.mintNFT(
            nftMetadata.metadataURI,
            nftMetadata.royaltyBps,
            nftMetadata.category,
            { value: mintFee },
        )

        console.log("Transaction hash:", tx.hash)
        console.log("Waiting for confirmation...")

        const receipt = await tx.wait()
        console.log(" NFT minted successfully!")
        console.log("Gas used:", receipt.gasUsed.toString())

        // Get the minted token data
        const tokenData = await luminaNFT.tokenData(nextTokenId)
        console.log("\n Minted NFT Info:")
        console.log("- Token ID:", nextTokenId.toString())
        console.log("- Creator:", tokenData.creator)
        console.log("- Category:", tokenData.category)
        console.log("- Royalty:", tokenData.royaltyBps.toString(), "bps")
        console.log(
            "- Mint timestamp:",
            new Date(Number(tokenData.mintTimestamp) * 1000).toLocaleString(),
        )

        // Check if we own the NFT
        const owner = await luminaNFT.ownerOf(nextTokenId)
        console.log("- Owner:", owner)
        console.log("- Verified creator:", tokenData.isVerifiedCreator)

        console.log("\n View on Somnia Explorer:")
        console.log(`https://explorer-testnet.somnia.network/tx/${tx.hash}`)
    } catch (error) {
        console.error("❌ Error minting NFT:", error.message)

        if (error.message.includes("Insufficient mint fee")) {
            console.log(" Make sure you have enough STT to cover the mint fee")
        } else if (error.message.includes("URI already used")) {
            console.log(" This metadata URI was already used, try again for a new random one")
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
