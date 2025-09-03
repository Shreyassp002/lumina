const { expect } = require("chai")
const { ethers } = require("hardhat")
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers")

describe("LuminaAuction", function () {
    // Fixture to deploy contracts
    async function deployAuctionFixture() {
        const [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners()

        // Deploy NFT contract first
        const LuminaNFT = await ethers.getContractFactory("LuminaNFT")
        const luminaNFT = await LuminaNFT.deploy()

        // Deploy Auction contract
        const LuminaAuction = await ethers.getContractFactory("LuminaAuction")
        const luminaAuction = await LuminaAuction.deploy(luminaNFT.target)

        // Mint an NFT for testing
        const mintFee = await luminaNFT.mintFee()
        await luminaNFT.connect(seller).mintNFT("ipfs://test", 500, "Art", { value: mintFee })

        // Approve auction contract to transfer NFT
        await luminaNFT.connect(seller).setApprovalForAll(luminaAuction.target, true)

        return { luminaNFT, luminaAuction, owner, seller, bidder1, bidder2, bidder3 }
    }

    describe("Deployment", function () {
        it("Should set correct NFT contract address", async function () {
            const { luminaNFT, luminaAuction } = await loadFixture(deployAuctionFixture)
            expect(await luminaAuction.luminaNFTContract()).to.equal(luminaNFT.target)
        })

        it("Should set correct owner", async function () {
            const { luminaAuction, owner } = await loadFixture(deployAuctionFixture)
            expect(await luminaAuction.owner()).to.equal(owner.address)
        })

        it("Should set correct platform fee", async function () {
            const { luminaAuction } = await loadFixture(deployAuctionFixture)
            expect(await luminaAuction.platformFeeBps()).to.equal(250)
        })

        it("Should set correct auction durations", async function () {
            const { luminaAuction } = await loadFixture(deployAuctionFixture)
            expect(await luminaAuction.minAuctionDuration()).to.equal(3600)
            expect(await luminaAuction.maxAuctionDuration()).to.equal(2592000)
        })
    })

    describe("Auction Creation", function () {
        it("Should create auction successfully", async function () {
            const { luminaAuction, seller } = await loadFixture(deployAuctionFixture)

            const startPrice = ethers.parseEther("0.1")
            const duration = 86400
            const minIncrement = ethers.parseEther("0.01")
            const buyNowPrice = ethers.parseEther("1.0")

            await expect(
                luminaAuction.connect(seller).createAuction(
                    1,
                    startPrice,
                    duration,
                    minIncrement,
                    0, // ENGLISH auction
                    buyNowPrice,
                ),
            ).to.emit(luminaAuction, "AuctionCreated")

            const auction = await luminaAuction.auctions(1)
            expect(auction.tokenId).to.equal(1)
            expect(auction.seller).to.equal(seller.address)
            expect(auction.startPrice).to.equal(startPrice)
            expect(auction.minIncrement).to.equal(minIncrement)
            expect(auction.active).to.equal(true)
            expect(auction.settled).to.equal(false)
        })

        it("Should transfer NFT to auction contract", async function () {
            const { luminaNFT, luminaAuction, seller } = await loadFixture(deployAuctionFixture)

            expect(await luminaNFT.ownerOf(1)).to.equal(seller.address)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            expect(await luminaNFT.ownerOf(1)).to.equal(luminaAuction.target)
        })

        it("Should fail if not NFT owner", async function () {
            const { luminaAuction, bidder1 } = await loadFixture(deployAuctionFixture)

            await expect(
                luminaAuction
                    .connect(bidder1)
                    .createAuction(
                        1,
                        ethers.parseEther("0.1"),
                        86400,
                        ethers.parseEther("0.01"),
                        0,
                        ethers.parseEther("1.0"),
                    ),
            ).to.be.revertedWith("Not NFT owner")
        })

        it("Should fail with invalid duration", async function () {
            const { luminaAuction, seller } = await loadFixture(deployAuctionFixture)

            await expect(
                luminaAuction.connect(seller).createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    1800, // Too short
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                ),
            ).to.be.revertedWith("Invalid duration")
        })

        it("Should fail with zero start price", async function () {
            const { luminaAuction, seller } = await loadFixture(deployAuctionFixture)

            await expect(
                luminaAuction
                    .connect(seller)
                    .createAuction(
                        1,
                        0,
                        86400,
                        ethers.parseEther("0.01"),
                        0,
                        ethers.parseEther("1.0"),
                    ),
            ).to.be.revertedWith("Start price must be > 0")
        })

        it("Should fail if token already in auction", async function () {
            const { luminaAuction, seller } = await loadFixture(deployAuctionFixture)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            await expect(
                luminaAuction
                    .connect(seller)
                    .createAuction(
                        1,
                        ethers.parseEther("0.1"),
                        86400,
                        ethers.parseEther("0.01"),
                        0,
                        ethers.parseEther("1.0"),
                    ),
            ).to.be.revertedWith("Token already in auction")
        })
    })

    describe("Bidding", function () {
        async function createAuctionFixture() {
            const fixture = await loadFixture(deployAuctionFixture)
            const { luminaAuction, seller } = fixture

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            return fixture
        }

        it("Should place first bid successfully", async function () {
            const { luminaAuction, bidder1 } = await loadFixture(createAuctionFixture)
            const bidAmount = ethers.parseEther("0.15")

            await expect(luminaAuction.connect(bidder1).placeBid(1, { value: bidAmount })).to.emit(
                luminaAuction,
                "BidPlaced",
            )

            const auction = await luminaAuction.auctions(1)
            expect(auction.currentBid).to.equal(bidAmount)
            expect(auction.currentBidder).to.equal(bidder1.address)
        })

        it("Should place higher bid and refund previous bidder", async function () {
            const { luminaAuction, bidder1, bidder2 } = await loadFixture(createAuctionFixture)

            const firstBid = ethers.parseEther("0.15")
            await luminaAuction.connect(bidder1).placeBid(1, { value: firstBid })

            const secondBid = ethers.parseEther("0.25")
            await luminaAuction.connect(bidder2).placeBid(1, { value: secondBid })

            const auction = await luminaAuction.auctions(1)
            expect(auction.currentBid).to.equal(secondBid)
            expect(auction.currentBidder).to.equal(bidder2.address)

            expect(await luminaAuction.pendingWithdrawals(bidder1.address)).to.equal(firstBid)
        })

        it("Should fail if bid is too low", async function () {
            const { luminaAuction, bidder1, bidder2 } = await loadFixture(createAuctionFixture)

            await luminaAuction.connect(bidder1).placeBid(1, { value: ethers.parseEther("0.15") })

            // Bid that's less than current bid + minimum increment (0.15 + 0.01 = 0.16)
            await expect(
                luminaAuction.connect(bidder2).placeBid(1, { value: ethers.parseEther("0.155") }),
            ).to.be.revertedWith("Bid too low")
        })

        it("Should fail if seller tries to bid", async function () {
            const { luminaAuction, seller } = await loadFixture(createAuctionFixture)

            await expect(
                luminaAuction.connect(seller).placeBid(1, { value: ethers.parseEther("0.15") }),
            ).to.be.revertedWith("Seller cannot bid")
        })

        it("Should extend auction if bid placed near end (anti-sniping)", async function () {
            const { luminaAuction, bidder1 } = await loadFixture(createAuctionFixture)

            const auction = await luminaAuction.auctions(1)
            await time.increaseTo(auction.endTime - BigInt(300))

            const bidAmount = ethers.parseEther("0.15")
            await expect(luminaAuction.connect(bidder1).placeBid(1, { value: bidAmount })).to.emit(
                luminaAuction,
                "AuctionExtended",
            )

            const updatedAuction = await luminaAuction.auctions(1)
            expect(updatedAuction.endTime).to.be.greaterThan(auction.endTime)
        })
    })

    describe("Auction Settlement", function () {
        async function createAuctionWithBidsFixture() {
            const fixture = await loadFixture(deployAuctionFixture)
            const { luminaAuction, seller, bidder1, bidder2 } = fixture

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            await luminaAuction.connect(bidder1).placeBid(1, { value: ethers.parseEther("0.15") })
            await luminaAuction.connect(bidder2).placeBid(1, { value: ethers.parseEther("0.25") })

            return fixture
        }

        it("Should settle auction after end time", async function () {
            const { luminaNFT, luminaAuction, bidder2 } = await loadFixture(
                createAuctionWithBidsFixture,
            )

            const auction = await luminaAuction.auctions(1)
            await time.increaseTo(auction.endTime + BigInt(1))

            await expect(luminaAuction.settleAuction(1))
                .to.emit(luminaAuction, "AuctionSettled")
                .withArgs(1, bidder2.address, ethers.parseEther("0.25"))

            expect(await luminaNFT.ownerOf(1)).to.equal(bidder2.address)

            const settledAuction = await luminaAuction.auctions(1)
            expect(settledAuction.active).to.equal(false)
            expect(settledAuction.settled).to.equal(true)
        })

        it("Should distribute payments correctly", async function () {
            const { luminaAuction, seller } = await loadFixture(createAuctionWithBidsFixture)

            const auction = await luminaAuction.auctions(1)
            await time.increaseTo(auction.endTime + BigInt(1))

            const winningBid = ethers.parseEther("0.25")
            const platformFee = (winningBid * BigInt(250)) / BigInt(10000)
            const expectedSellerProceeds = winningBid - platformFee

            await luminaAuction.settleAuction(1)

            expect(await luminaAuction.pendingWithdrawals(seller.address)).to.equal(
                expectedSellerProceeds,
            )
        })

        it("Should fail to settle before auction ends", async function () {
            const { luminaAuction } = await loadFixture(createAuctionWithBidsFixture)

            await expect(luminaAuction.settleAuction(1)).to.be.revertedWith("Auction not ended")
        })

        it("Should return NFT to seller if no bids", async function () {
            const { luminaNFT, luminaAuction, seller } = await loadFixture(deployAuctionFixture)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            const auction = await luminaAuction.auctions(1)
            await time.increaseTo(auction.endTime + BigInt(1))

            await expect(luminaAuction.settleAuction(1))
                .to.emit(luminaAuction, "AuctionSettled")
                .withArgs(1, ethers.ZeroAddress, 0)

            expect(await luminaNFT.ownerOf(1)).to.equal(seller.address)
        })
    })

    describe("Auction Cancellation", function () {
        it("Should cancel auction if no bids", async function () {
            const { luminaNFT, luminaAuction, seller } = await loadFixture(deployAuctionFixture)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            await expect(luminaAuction.connect(seller).cancelAuction(1))
                .to.emit(luminaAuction, "AuctionCanceled")
                .withArgs(1)

            expect(await luminaNFT.ownerOf(1)).to.equal(seller.address)

            const auction = await luminaAuction.auctions(1)
            expect(auction.active).to.equal(false)
        })

        it("Should fail to cancel if auction has bids", async function () {
            const { luminaAuction, seller, bidder1 } = await loadFixture(deployAuctionFixture)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            await luminaAuction.connect(bidder1).placeBid(1, { value: ethers.parseEther("0.15") })

            await expect(luminaAuction.connect(seller).cancelAuction(1)).to.be.revertedWith(
                "Auction has bids",
            )
        })

        it("Should fail to cancel if not seller", async function () {
            const { luminaAuction, seller, bidder1 } = await loadFixture(deployAuctionFixture)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            await expect(luminaAuction.connect(bidder1).cancelAuction(1)).to.be.revertedWith(
                "Not auction seller",
            )
        })
    })

    describe("Withdrawals", function () {
        it("Should allow withdrawal of pending funds", async function () {
            const { luminaAuction, seller, bidder1, bidder2 } =
                await loadFixture(deployAuctionFixture)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            const firstBid = ethers.parseEther("0.15")
            await luminaAuction.connect(bidder1).placeBid(1, { value: firstBid })
            await luminaAuction.connect(bidder2).placeBid(1, { value: ethers.parseEther("0.25") })

            const initialBalance = await ethers.provider.getBalance(bidder1.address)

            await luminaAuction.connect(bidder1).withdraw()

            const finalBalance = await ethers.provider.getBalance(bidder1.address)
            expect(finalBalance).to.be.greaterThan(initialBalance)
            expect(await luminaAuction.pendingWithdrawals(bidder1.address)).to.equal(0)
        })

        it("Should fail to withdraw if no pending funds", async function () {
            const { luminaAuction, bidder1 } = await loadFixture(deployAuctionFixture)

            await expect(luminaAuction.connect(bidder1).withdraw()).to.be.revertedWith(
                "No funds to withdraw",
            )
        })
    })

    describe("Admin Functions", function () {
        it("Should set platform fee (only owner)", async function () {
            const { luminaAuction, owner } = await loadFixture(deployAuctionFixture)

            await luminaAuction.connect(owner).setPlatformFee(300)
            expect(await luminaAuction.platformFeeBps()).to.equal(300)
        })

        it("Should fail to set platform fee too high", async function () {
            const { luminaAuction, owner } = await loadFixture(deployAuctionFixture)

            await expect(luminaAuction.connect(owner).setPlatformFee(1500)).to.be.revertedWith(
                "Fee too high",
            )
        })

        it("Should withdraw platform fees (only owner)", async function () {
            const { luminaAuction, owner, seller, bidder1 } =
                await loadFixture(deployAuctionFixture)

            // Create auction and complete it to generate platform fees
            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            await luminaAuction.connect(bidder1).placeBid(1, { value: ethers.parseEther("0.15") })

            const auction = await luminaAuction.auctions(1)
            await time.increaseTo(auction.endTime + BigInt(1))
            await luminaAuction.settleAuction(1)

            const initialBalance = await ethers.provider.getBalance(owner.address)
            await luminaAuction.connect(owner).withdrawPlatformFees()
            const finalBalance = await ethers.provider.getBalance(owner.address)

            expect(finalBalance).to.be.greaterThan(initialBalance)
        })

        it("Should pause and unpause (only owner)", async function () {
            const { luminaAuction, owner, seller } = await loadFixture(deployAuctionFixture)

            await luminaAuction.connect(owner).pause()

            await expect(
                luminaAuction
                    .connect(seller)
                    .createAuction(
                        1,
                        ethers.parseEther("0.1"),
                        86400,
                        ethers.parseEther("0.01"),
                        0,
                        ethers.parseEther("1.0"),
                    ),
            ).to.be.revertedWithCustomError(luminaAuction, "EnforcedPause")

            await luminaAuction.connect(owner).unpause()

            await expect(
                luminaAuction
                    .connect(seller)
                    .createAuction(
                        1,
                        ethers.parseEther("0.1"),
                        86400,
                        ethers.parseEther("0.01"),
                        0,
                        ethers.parseEther("1.0"),
                    ),
            ).to.not.be.reverted
        })
    })

    describe("View Functions", function () {
        it("Should return auction bid history", async function () {
            const { luminaAuction, seller, bidder1, bidder2 } =
                await loadFixture(deployAuctionFixture)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            await luminaAuction.connect(bidder1).placeBid(1, { value: ethers.parseEther("0.15") })
            await luminaAuction.connect(bidder2).placeBid(1, { value: ethers.parseEther("0.25") })

            const bids = await luminaAuction.getAuctionBids(1)
            expect(bids.length).to.equal(2)
            expect(bids[0].bidder).to.equal(bidder1.address)
            expect(bids[0].amount).to.equal(ethers.parseEther("0.15"))
            expect(bids[1].bidder).to.equal(bidder2.address)
            expect(bids[1].amount).to.equal(ethers.parseEther("0.25"))
        })

        it("Should return current auction ID", async function () {
            const { luminaAuction, seller } = await loadFixture(deployAuctionFixture)

            expect(await luminaAuction.getCurrentAuctionId()).to.equal(0)

            await luminaAuction
                .connect(seller)
                .createAuction(
                    1,
                    ethers.parseEther("0.1"),
                    86400,
                    ethers.parseEther("0.01"),
                    0,
                    ethers.parseEther("1.0"),
                )

            expect(await luminaAuction.getCurrentAuctionId()).to.equal(1)
        })
    })
})
