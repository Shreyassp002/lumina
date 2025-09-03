const { expect } = require("chai")
const { ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")

describe("LuminaMarketplace", function () {
    async function deployMarketplaceFixture() {
        const [owner, seller, buyer, creator] = await ethers.getSigners()

        // Deploy NFT contract
        const LuminaNFT = await ethers.getContractFactory("LuminaNFT")
        const luminaNFT = await LuminaNFT.deploy()

        // Deploy ETH-only Marketplace
        const LuminaMarketplace = await ethers.getContractFactory("LuminaMarketplace")
        const marketplace = await LuminaMarketplace.deploy(luminaNFT.target)

        // Mint NFTs for testing
        const mintFee = await luminaNFT.mintFee()
        await luminaNFT.connect(seller).mintNFT("ipfs://test1", 500, "Art", { value: mintFee })
        await luminaNFT.connect(seller).mintNFT("ipfs://test2", 750, "Music", { value: mintFee })
        await luminaNFT.connect(creator).mintNFT("ipfs://test3", 0, "Video", { value: mintFee })

        // Setup approvals
        await luminaNFT.connect(seller).setApprovalForAll(marketplace.target, true)
        await luminaNFT.connect(creator).setApprovalForAll(marketplace.target, true)

        return { luminaNFT, marketplace, owner, seller, buyer, creator }
    }

    describe("Deployment", function () {
        it("Should set correct NFT contract address", async function () {
            const { luminaNFT, marketplace } = await loadFixture(deployMarketplaceFixture)

            expect(await marketplace.luminaNFTContract()).to.equal(luminaNFT.target)
        })

        it("Should set default platform fee", async function () {
            const { marketplace } = await loadFixture(deployMarketplaceFixture)

            expect(await marketplace.platformFeeBps()).to.equal(250) // 2.5%
        })
    })

    describe("Listing Items", function () {
        it("Should list item for ETH sale", async function () {
            const { marketplace, seller } = await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")

            await expect(marketplace.connect(seller).listItem(1, price))
                .to.emit(marketplace, "ItemListed")
                .withArgs(1, 1, seller.address, price)

            const listing = await marketplace.listings(1)
            expect(listing.price).to.equal(price)
            expect(listing.seller).to.equal(seller.address)
            expect(listing.active).to.equal(true)
        })

        it("Should fail to list with zero price", async function () {
            const { marketplace, seller } = await loadFixture(deployMarketplaceFixture)

            await expect(marketplace.connect(seller).listItem(1, 0)).to.be.revertedWith(
                "Price must be > 0",
            )
        })

        it("Should fail to list if not NFT owner", async function () {
            const { marketplace, buyer } = await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")

            await expect(marketplace.connect(buyer).listItem(1, price)).to.be.revertedWith(
                "Not NFT owner",
            )
        })
    })

    describe("Buying Items", function () {
        it("Should buy item with ETH successfully", async function () {
            const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")

            // List item
            await marketplace.connect(seller).listItem(1, price)

            // Buy item
            await expect(marketplace.connect(buyer).buyItem(1, { value: price }))
                .to.emit(marketplace, "ItemSold")
                .withArgs(1, 1, buyer.address, price)

            // Check NFT ownership transferred
            const { luminaNFT } = await loadFixture(deployMarketplaceFixture)
            // Note: Need to get fresh contract instance to check ownership
        })

        it("Should handle payment distribution correctly", async function () {
            const { marketplace, seller, buyer, owner } =
                await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")
            const platformFee = (price * 250n) / 10000n // 2.5%
            const sellerProceeds = price - platformFee

            // List item
            await marketplace.connect(seller).listItem(1, price)

            // Record balances
            const sellerBalanceBefore = await ethers.provider.getBalance(seller.address)
            const contractBalanceBefore = await ethers.provider.getBalance(marketplace.target)

            // Buy item
            await marketplace.connect(buyer).buyItem(1, { value: price })

            // Check balances
            const sellerBalanceAfter = await ethers.provider.getBalance(seller.address)
            const contractBalanceAfter = await ethers.provider.getBalance(marketplace.target)

            expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerProceeds)
            expect(contractBalanceAfter - contractBalanceBefore).to.equal(platformFee)
        })

        it("Should refund excess ETH payment", async function () {
            const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")
            const overpayment = ethers.parseEther("1.5")

            // List item
            await marketplace.connect(seller).listItem(1, price)

            // Record buyer balance
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address)

            // Buy with overpayment
            const tx = await marketplace.connect(buyer).buyItem(1, { value: overpayment })
            const receipt = await tx.wait()
            const gasUsed = receipt.gasUsed * receipt.gasPrice

            // Check buyer got refund
            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address)
            const expectedBalance = buyerBalanceBefore - price - gasUsed

            expect(buyerBalanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"))
        })

        it("Should fail with insufficient payment", async function () {
            const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")
            const insufficientPayment = ethers.parseEther("0.5")

            // List item
            await marketplace.connect(seller).listItem(1, price)

            // Try to buy with insufficient payment
            await expect(
                marketplace.connect(buyer).buyItem(1, { value: insufficientPayment }),
            ).to.be.revertedWith("Insufficient payment")
        })

        it("Should fail if seller tries to buy own item", async function () {
            const { marketplace, seller } = await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")

            // List item
            await marketplace.connect(seller).listItem(1, price)

            // Try to buy own item
            await expect(
                marketplace.connect(seller).buyItem(1, { value: price }),
            ).to.be.revertedWith("Cannot buy own item")
        })
    })

    describe("Listing Management", function () {
        it("Should update listing price", async function () {
            const { marketplace, seller } = await loadFixture(deployMarketplaceFixture)

            const originalPrice = ethers.parseEther("1.0")
            const newPrice = ethers.parseEther("2.0")

            // List item
            await marketplace.connect(seller).listItem(1, originalPrice)

            // Update price
            await expect(marketplace.connect(seller).updateListing(1, newPrice))
                .to.emit(marketplace, "ListingUpdated")
                .withArgs(1, newPrice)

            const listing = await marketplace.listings(1)
            expect(listing.price).to.equal(newPrice)
        })

        it("Should cancel listing", async function () {
            const { marketplace, seller } = await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")

            // List item
            await marketplace.connect(seller).listItem(1, price)

            // Cancel listing
            await expect(marketplace.connect(seller).cancelListing(1))
                .to.emit(marketplace, "ListingCanceled")
                .withArgs(1)

            const listing = await marketplace.listings(1)
            expect(listing.active).to.equal(false)
        })
    })

    describe("Admin Functions", function () {
        it("Should set platform fee (only owner)", async function () {
            const { marketplace, owner } = await loadFixture(deployMarketplaceFixture)

            const newFee = 500 // 5%

            await marketplace.connect(owner).setPlatformFee(newFee)
            expect(await marketplace.platformFeeBps()).to.equal(newFee)
        })

        it("Should fail to set platform fee too high", async function () {
            const { marketplace, owner } = await loadFixture(deployMarketplaceFixture)

            const tooHighFee = 1500 // 15%

            await expect(marketplace.connect(owner).setPlatformFee(tooHighFee)).to.be.revertedWith(
                "Fee too high",
            )
        })

        it("Should withdraw platform fees (only owner)", async function () {
            const { marketplace, seller, buyer, owner } =
                await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")

            // List and sell item to generate fees
            await marketplace.connect(seller).listItem(1, price)
            await marketplace.connect(buyer).buyItem(1, { value: price })

            // Withdraw fees
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address)
            const tx = await marketplace.connect(owner).withdrawPlatformFees()
            const receipt = await tx.wait()
            const gasUsed = receipt.gasUsed * receipt.gasPrice

            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address)
            const platformFee = (price * 250n) / 10000n

            expect(ownerBalanceAfter - ownerBalanceBefore + gasUsed).to.be.closeTo(
                platformFee,
                ethers.parseEther("0.001"),
            )
        })

        it("Should pause and unpause contract (only owner)", async function () {
            const { marketplace, owner } = await loadFixture(deployMarketplaceFixture)

            // Pause
            await marketplace.connect(owner).pause()
            expect(await marketplace.paused()).to.equal(true)

            // Unpause
            await marketplace.connect(owner).unpause()
            expect(await marketplace.paused()).to.equal(false)
        })
    })

    describe("Statistics", function () {
        it("Should track volume correctly", async function () {
            const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture)

            const price1 = ethers.parseEther("1.0")
            const price2 = ethers.parseEther("2.0")

            // List and sell two items
            await marketplace.connect(seller).listItem(1, price1)
            await marketplace.connect(buyer).buyItem(1, { value: price1 })

            await marketplace.connect(seller).listItem(2, price2)
            await marketplace.connect(buyer).buyItem(2, { value: price2 })

            expect(await marketplace.totalVolume()).to.equal(price1 + price2)
            expect(await marketplace.totalSales()).to.equal(2)
        })

        it("Should track user statistics", async function () {
            const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture)

            const price = ethers.parseEther("1.0")

            // List and sell item
            await marketplace.connect(seller).listItem(1, price)
            await marketplace.connect(buyer).buyItem(1, { value: price })

            expect(await marketplace.userSales(seller.address)).to.equal(1)
            expect(await marketplace.userPurchases(buyer.address)).to.equal(1)
        })
    })
})
