const { expect } = require("chai")
const { ethers, deployments, getNamedAccounts } = require("hardhat")

describe("LuminaNFT", function () {
    let luminaNFT
    let deployer, user1, user2, user3
    const mintFee = ethers.parseEther("0.001")

    beforeEach(async function () {
        // Get signers
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        user1 = accounts[1]
        user2 = accounts[2]
        user3 = accounts[3]

        // Deploy contracts
        await deployments.fixture(["nft"])
        const luminaNFTDeployment = await deployments.get("LuminaNFT")
        luminaNFT = await ethers.getContractAt("LuminaNFT", luminaNFTDeployment.address)
    })

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await luminaNFT.name()).to.equal("Lumina")
            expect(await luminaNFT.symbol()).to.equal("LUMINA")
        })

        it("Should set the correct owner", async function () {
            expect(await luminaNFT.owner()).to.equal(deployer.address)
        })

        it("Should start with token counter at 0", async function () {
            expect(await luminaNFT.getCurrentTokenId()).to.equal(0)
        })

        it("Should set correct initial mint fee", async function () {
            expect(await luminaNFT.mintFee()).to.equal(mintFee)
        })

        it("Should set correct max royalty", async function () {
            expect(await luminaNFT.maxRoyaltyBps()).to.equal(1000) // 10%
        })
    })

    describe("NFT Minting", function () {
        const metadataURI = "ipfs://QmTestHash123"
        const royaltyBps = 500 // 5%
        const category = "Digital Art"

        it("Should mint NFT successfully with correct parameters", async function () {
            await expect(
                luminaNFT.connect(user1).mintNFT(metadataURI, royaltyBps, category, {
                    value: mintFee,
                }),
            )
                .to.emit(luminaNFT, "NFTMinted")
                .withArgs(1, user1.address, metadataURI, category)

            expect(await luminaNFT.getCurrentTokenId()).to.equal(1)
            expect(await luminaNFT.ownerOf(1)).to.equal(user1.address)
        })

        it("Should store correct token data", async function () {
            await luminaNFT.connect(user1).mintNFT(metadataURI, royaltyBps, category, {
                value: mintFee,
            })

            const tokenData = await luminaNFT.tokenData(1)
            expect(tokenData.creator).to.equal(user1.address)
            expect(tokenData.metadataURI).to.equal(metadataURI)
            expect(tokenData.royaltyBps).to.equal(royaltyBps)
            expect(tokenData.category).to.equal(category)
            expect(tokenData.isVerifiedCreator).to.equal(false)
        })

        it("Should return correct token URI", async function () {
            await luminaNFT.connect(user1).mintNFT(metadataURI, royaltyBps, category, {
                value: mintFee,
            })

            expect(await luminaNFT.tokenURI(1)).to.equal(metadataURI)
        })

        it("Should update creator profile total minted", async function () {
            await luminaNFT.connect(user1).mintNFT(metadataURI, royaltyBps, category, {
                value: mintFee,
            })

            const profile = await luminaNFT.creatorProfiles(user1.address)
            expect(profile.totalMinted).to.equal(1)
        })

        it("Should fail with insufficient mint fee", async function () {
            await expect(
                luminaNFT.connect(user1).mintNFT(metadataURI, royaltyBps, category, {
                    value: ethers.parseEther("0.0005"), // Less than required
                }),
            ).to.be.revertedWith("Insufficient mint fee")
        })

        it("Should fail with empty metadata URI", async function () {
            await expect(
                luminaNFT.connect(user1).mintNFT("", royaltyBps, category, {
                    value: mintFee,
                }),
            ).to.be.revertedWith("Empty metadata URI")
        })

        it("Should fail with royalty too high", async function () {
            await expect(
                luminaNFT.connect(user1).mintNFT(metadataURI, 1500, category, {
                    // 15% > 10% max
                    value: mintFee,
                }),
            ).to.be.revertedWith("Royalty too high")
        })

        it("Should fail with duplicate URI", async function () {
            await luminaNFT.connect(user1).mintNFT(metadataURI, royaltyBps, category, {
                value: mintFee,
            })

            await expect(
                luminaNFT.connect(user2).mintNFT(metadataURI, royaltyBps, category, {
                    value: mintFee,
                }),
            ).to.be.revertedWith("URI already used")
        })
    })

    describe("Creator Profiles", function () {
        it("Should update creator profile", async function () {
            const name = "Test Artist"
            const bio = "Digital artist creating amazing NFTs"
            const socialLink = "https://twitter.com/testartist"

            await expect(luminaNFT.connect(user1).updateCreatorProfile(name, bio, socialLink))
                .to.emit(luminaNFT, "CreatorProfileUpdated")
                .withArgs(user1.address)

            const profile = await luminaNFT.creatorProfiles(user1.address)
            expect(profile.name).to.equal(name)
            expect(profile.bio).to.equal(bio)
            expect(profile.socialLink).to.equal(socialLink)
        })

        it("Should verify creator (only owner)", async function () {
            await expect(luminaNFT.connect(deployer).verifyCreator(user1.address))
                .to.emit(luminaNFT, "CreatorVerified")
                .withArgs(user1.address)

            expect(await luminaNFT.verifiedCreators(user1.address)).to.equal(true)

            const profile = await luminaNFT.creatorProfiles(user1.address)
            expect(profile.verified).to.equal(true)
        })

        it("Should fail to verify creator if not owner", async function () {
            await expect(
                luminaNFT.connect(user1).verifyCreator(user2.address),
            ).to.be.revertedWithCustomError(luminaNFT, "OwnableUnauthorizedAccount")
        })
    })

    describe("Royalty Management", function () {
        const metadataURI = "ipfs://QmTestHash123"
        const initialRoyalty = 500 // 5%
        const category = "Digital Art"

        beforeEach(async function () {
            await luminaNFT.connect(user1).mintNFT(metadataURI, initialRoyalty, category, {
                value: mintFee,
            })
        })

        it("Should update token royalty by creator", async function () {
            const newRoyalty = 750 // 7.5%

            await expect(luminaNFT.connect(user1).updateTokenRoyalty(1, newRoyalty))
                .to.emit(luminaNFT, "RoyaltyUpdated")
                .withArgs(1, newRoyalty)

            const tokenData = await luminaNFT.tokenData(1)
            expect(tokenData.royaltyBps).to.equal(newRoyalty)
        })

        it("Should fail to update royalty if not creator", async function () {
            await expect(luminaNFT.connect(user2).updateTokenRoyalty(1, 750)).to.be.revertedWith(
                "Not token creator",
            )
        })

        it("Should fail to update royalty if too high", async function () {
            await expect(
                luminaNFT.connect(user1).updateTokenRoyalty(1, 1500), // 15% > 10% max
            ).to.be.revertedWith("Royalty too high")
        })

        it("Should fail to update royalty for non-existent token", async function () {
            await expect(luminaNFT.connect(user1).updateTokenRoyalty(999, 750)).to.be.revertedWith(
                "Token does not exist",
            )
        })
    })

    describe("Admin Functions", function () {
        it("Should set marketplace contract (only owner)", async function () {
            const marketplaceAddress = user2.address // Mock address

            await luminaNFT.connect(deployer).setMarketplaceContract(marketplaceAddress)
            expect(await luminaNFT.marketplaceContract()).to.equal(marketplaceAddress)
        })

        it("Should fail to set marketplace contract if not owner", async function () {
            await expect(
                luminaNFT.connect(user1).setMarketplaceContract(user2.address),
            ).to.be.revertedWithCustomError(luminaNFT, "OwnableUnauthorizedAccount")
        })

        it("Should update mint fee (only owner)", async function () {
            const newMintFee = ethers.parseEther("0.002")

            await luminaNFT.connect(deployer).setMintFee(newMintFee)
            expect(await luminaNFT.mintFee()).to.equal(newMintFee)
        })

        it("Should fail to update mint fee if not owner", async function () {
            await expect(
                luminaNFT.connect(user1).setMintFee(ethers.parseEther("0.002")),
            ).to.be.revertedWithCustomError(luminaNFT, "OwnableUnauthorizedAccount")
        })

        it("Should pause and unpause contract (only owner)", async function () {
            await luminaNFT.connect(deployer).pause()
            expect(await luminaNFT.paused()).to.equal(true)

            // Should fail to mint when paused
            await expect(
                luminaNFT.connect(user1).mintNFT("ipfs://test", 500, "Art", {
                    value: mintFee,
                }),
            ).to.be.revertedWithCustomError(luminaNFT, "EnforcedPause")

            await luminaNFT.connect(deployer).unpause()
            expect(await luminaNFT.paused()).to.equal(false)
        })

        it("Should withdraw fees (only owner)", async function () {
            // Mint some NFTs to generate fees
            await luminaNFT.connect(user1).mintNFT("ipfs://test1", 500, "Art", {
                value: mintFee,
            })
            await luminaNFT.connect(user2).mintNFT("ipfs://test2", 500, "Art", {
                value: mintFee,
            })

            const initialBalance = await ethers.provider.getBalance(deployer.address)
            const contractBalance = await ethers.provider.getBalance(luminaNFT.target)

            expect(contractBalance).to.equal(mintFee * 2n)

            const tx = await luminaNFT.connect(deployer).withdrawFees()
            const receipt = await tx.wait()
            const gasUsed = receipt.gasUsed * receipt.gasPrice

            const finalBalance = await ethers.provider.getBalance(deployer.address)
            expect(finalBalance).to.be.closeTo(
                initialBalance + contractBalance - gasUsed,
                ethers.parseEther("0.001"), // Allow for small gas variations
            )
        })

        it("Should fail to withdraw fees if not owner", async function () {
            await expect(luminaNFT.connect(user1).withdrawFees()).to.be.revertedWithCustomError(
                luminaNFT,
                "OwnableUnauthorizedAccount",
            )
        })
    })

    describe("ERC721 Compliance", function () {
        const metadataURI = "ipfs://QmTestHash123"
        const royaltyBps = 500
        const category = "Digital Art"

        beforeEach(async function () {
            await luminaNFT.connect(user1).mintNFT(metadataURI, royaltyBps, category, {
                value: mintFee,
            })
        })

        it("Should support ERC721 interface", async function () {
            const ERC721_INTERFACE_ID = "0x80ac58cd"
            expect(await luminaNFT.supportsInterface(ERC721_INTERFACE_ID)).to.equal(true)
        })

        it("Should support ERC2981 royalty interface", async function () {
            const ERC2981_INTERFACE_ID = "0x2a55205a"
            expect(await luminaNFT.supportsInterface(ERC2981_INTERFACE_ID)).to.equal(true)
        })

        it("Should transfer NFT correctly", async function () {
            await luminaNFT.connect(user1).transferFrom(user1.address, user2.address, 1)
            expect(await luminaNFT.ownerOf(1)).to.equal(user2.address)
        })

        it("Should approve and transfer from", async function () {
            await luminaNFT.connect(user1).approve(user2.address, 1)
            await luminaNFT.connect(user2).transferFrom(user1.address, user3.address, 1)
            expect(await luminaNFT.ownerOf(1)).to.equal(user3.address)
        })
    })
})
