// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title LuminaAuction
 * @dev Handles all auction mechanics for Lumina platform
 */
contract LuminaAuction is ReentrancyGuard, Pausable, Ownable {
    enum AuctionType {
        ENGLISH,
        DUTCH,
        RESERVE
    }

    struct Auction {
        uint256 tokenId; // NFT being auctioned
        address nftContract; // NFT contract address
        address seller; // NFT owner
        uint256 startPrice; // Starting/reserve price
        uint256 currentBid; // Highest current bid
        address currentBidder; // Current highest bidder
        uint256 startTime; // Auction start time
        uint256 endTime; // Auction end timestamp
        uint256 minIncrement; // Minimum bid increment
        AuctionType auctionType; // Type of auction
        bool active; // Auction status
        bool settled; // Settlement status
        uint256 buyNowPrice; // Optional buy-now price
        uint256 extensionTime; // Anti-sniping extension
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    // State variables
    uint256 private _auctionCounter;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(uint256 => uint256) public auctionIdByTokenId; // tokenId => auctionId

    // Platform settings
    uint256 public platformFeeBps = 250; // 2.5%
    uint256 public minAuctionDuration = 1 hours;
    uint256 public maxAuctionDuration = 30 days;
    uint256 public timeExtension = 10 minutes; // Anti-sniping
    address public luminaNFTContract;

    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 startPrice,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
    );
    event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 finalPrice);
    event AuctionCanceled(uint256 indexed auctionId);
    event AuctionExtended(uint256 indexed auctionId, uint256 newEndTime);

    modifier validAuction(uint256 auctionId) {
        require(auctions[auctionId].active, "Auction not active");
        require(auctions[auctionId].endTime > block.timestamp, "Auction ended");
        _;
    }

    modifier auctionExists(uint256 auctionId) {
        require(auctionId <= _auctionCounter && auctionId > 0, "Auction does not exist");
        _;
    }

    constructor(address _luminaNFTContract) Ownable(msg.sender) {
        luminaNFTContract = _luminaNFTContract;
    }

    /**
     * @dev Create a new auction
     */
    function createAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration,
        uint256 minIncrement,
        AuctionType auctionType,
        uint256 buyNowPrice
    ) external nonReentrant whenNotPaused {
        require(
            duration >= minAuctionDuration && duration <= maxAuctionDuration,
            "Invalid duration"
        );
        require(startPrice > 0, "Start price must be > 0");
        require(minIncrement > 0, "Min increment must be > 0");
        require(auctionIdByTokenId[tokenId] == 0, "Token already in auction");

        // Verify NFT ownership and get approval
        IERC721 nftContract = IERC721(luminaNFTContract);
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
                nftContract.getApproved(tokenId) == address(this),
            "Contract not approved"
        );

        // Transfer NFT to auction contract (escrow)
        nftContract.transferFrom(msg.sender, address(this), tokenId);

        _auctionCounter++;
        uint256 auctionId = _auctionCounter;

        uint256 endTime = block.timestamp + duration;

        auctions[auctionId] = Auction({
            tokenId: tokenId,
            nftContract: luminaNFTContract,
            seller: msg.sender,
            startPrice: startPrice,
            currentBid: 0,
            currentBidder: address(0),
            startTime: block.timestamp,
            endTime: endTime,
            minIncrement: minIncrement,
            auctionType: auctionType,
            active: true,
            settled: false,
            buyNowPrice: buyNowPrice,
            extensionTime: timeExtension
        });

        auctionIdByTokenId[tokenId] = auctionId;

        emit AuctionCreated(auctionId, tokenId, msg.sender, startPrice, endTime);
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 auctionId) external payable nonReentrant validAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(msg.value > 0, "Bid must be > 0");

        uint256 minBidAmount;
        if (auction.currentBid == 0) {
            minBidAmount = auction.startPrice;
        } else {
            minBidAmount = auction.currentBid + auction.minIncrement;
        }

        require(msg.value >= minBidAmount, "Bid too low");

        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            pendingWithdrawals[auction.currentBidder] += auction.currentBid;
        }

        // Update auction state
        auction.currentBid = msg.value;
        auction.currentBidder = msg.sender;

        // Record bid
        auctionBids[auctionId].push(
            Bid({bidder: msg.sender, amount: msg.value, timestamp: block.timestamp})
        );

        // Anti-sniping: extend auction if bid placed in last 10 minutes
        if (auction.endTime - block.timestamp <= auction.extensionTime) {
            auction.endTime = block.timestamp + auction.extensionTime;
            emit AuctionExtended(auctionId, auction.endTime);
        }

        emit BidPlaced(auctionId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Settle auction after it ends
     */
    function settleAuction(uint256 auctionId) external nonReentrant auctionExists(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.settled, "Already settled");

        auction.active = false;
        auction.settled = true;

        IERC721 nftContract = IERC721(auction.nftContract);

        if (auction.currentBidder != address(0)) {
            // Transfer NFT to winner
            nftContract.transferFrom(address(this), auction.currentBidder, auction.tokenId);

            // Calculate fees and royalties
            uint256 platformFee = (auction.currentBid * platformFeeBps) / 10000;
            uint256 royaltyAmount = 0;
            address royaltyRecipient = address(0);

            // Get royalty info
            if (IERC165(auction.nftContract).supportsInterface(0x2a55205a)) {
                (royaltyRecipient, royaltyAmount) = IERC2981(auction.nftContract).royaltyInfo(
                    auction.tokenId,
                    auction.currentBid
                );
            }

            // Calculate seller proceeds
            uint256 sellerProceeds = auction.currentBid - platformFee - royaltyAmount;

            // Distribute payments
            pendingWithdrawals[auction.seller] += sellerProceeds;
            if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
                pendingWithdrawals[royaltyRecipient] += royaltyAmount;
            }

            emit AuctionSettled(auctionId, auction.currentBidder, auction.currentBid);
        } else {
            // No bids - return NFT to seller
            nftContract.transferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionSettled(auctionId, address(0), 0);
        }

        // Clear mapping
        auctionIdByTokenId[auction.tokenId] = 0;
    }

    /**
     * @dev Cancel auction (only seller, only if no bids)
     */
    function cancelAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "Auction not active");
        require(auction.seller == msg.sender, "Not auction seller");
        require(auction.currentBidder == address(0), "Auction has bids");

        auction.active = false;

        // Return NFT to seller
        IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);

        // Clear mapping
        auctionIdByTokenId[auction.tokenId] = 0;

        emit AuctionCanceled(auctionId);
    }

    /**
     * @dev Withdraw pending funds
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get auction bid history
     */
    function getAuctionBids(uint256 auctionId) external view returns (Bid[] memory) {
        return auctionBids[auctionId];
    }

    /**
     * @dev Get current auction counter
     */
    function getCurrentAuctionId() external view returns (uint256) {
        return _auctionCounter;
    }

    /**
     * @dev Admin functions
     */
    function setPlatformFee(uint256 _platformFeeBps) external onlyOwner {
        require(_platformFeeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = _platformFeeBps;
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
