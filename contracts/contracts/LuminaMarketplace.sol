// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title LuminaMarketplace
 * @dev Unified marketplace for fixed-price sales and platform management
 */
contract LuminaMarketplace is ReentrancyGuard, Pausable, Ownable {
    struct Listing {
        uint256 tokenId;
        address nftContract;
        address seller;
        uint256 price;
        uint256 listingTime;
        bool active;
    }

    // State variables
    mapping(uint256 => Listing) public listings; // listingId => Listing
    mapping(uint256 => uint256) public tokenToListing; // tokenId => listingId
    uint256 private _listingCounter;

    // Platform settings
    uint256 public platformFeeBps = 250; // 2.5%
    address public luminaNFTContract;
    address public luminaAuctionContract;

    // Platform statistics
    mapping(address => uint256) public userSales;
    mapping(address => uint256) public userPurchases;
    uint256 public totalVolume;
    uint256 public totalSales;

    // Events
    event ItemListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event ItemSold(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price
    );
    event ListingCanceled(uint256 indexed listingId);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);

    modifier validListing(uint256 listingId) {
        require(listingId <= _listingCounter && listingId > 0, "Invalid listing");
        require(listings[listingId].active, "Listing not active");
        _;
    }

    constructor(address _luminaNFTContract) Ownable(msg.sender) {
        luminaNFTContract = _luminaNFTContract;
    }

    /**
     * @dev List an NFT for fixed-price sale
     */
    function listItem(uint256 tokenId, uint256 price) external nonReentrant whenNotPaused {
        require(price > 0, "Price must be > 0");
        require(tokenToListing[tokenId] == 0, "Token already listed");

        // Verify NFT ownership and approval
        IERC721 nftContract = IERC721(luminaNFTContract);
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
                nftContract.getApproved(tokenId) == address(this),
            "Contract not approved"
        );

        _listingCounter++;
        uint256 listingId = _listingCounter;

        listings[listingId] = Listing({
            tokenId: tokenId,
            nftContract: luminaNFTContract,
            seller: msg.sender,
            price: price,
            listingTime: block.timestamp,
            active: true
        });

        tokenToListing[tokenId] = listingId;

        emit ItemListed(listingId, tokenId, msg.sender, price);
    }

    /**
     * @dev Buy a listed NFT
     */
    function buyItem(uint256 listingId) external payable nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own item");

        // Verify NFT is still owned by seller
        IERC721 nftContract = IERC721(listing.nftContract);
        require(
            nftContract.ownerOf(listing.tokenId) == listing.seller,
            "NFT no longer owned by seller"
        );

        listing.active = false;
        tokenToListing[listing.tokenId] = 0;

        // Transfer NFT to buyer
        nftContract.transferFrom(listing.seller, msg.sender, listing.tokenId);

        // Handle payments
        _handlePayments(listing);

        // Update statistics
        userSales[listing.seller]++;
        userPurchases[msg.sender]++;
        totalVolume += listing.price;
        totalSales++;

        emit ItemSold(listingId, listing.tokenId, msg.sender, listing.price);
    }

    /**
     * @dev Internal function to handle payment distribution
     */
    function _handlePayments(Listing memory listing) internal {
        uint256 platformFee = (listing.price * platformFeeBps) / 10000;

        // Get royalty info
        (address royaltyRecipient, uint256 royaltyAmount) = _getRoyaltyInfo(listing);

        // Calculate seller proceeds
        uint256 sellerProceeds = listing.price - platformFee - royaltyAmount;

        // Transfer payments
        (bool sellerSuccess, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(sellerSuccess, "Seller payment failed");

        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            (bool royaltySuccess, ) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(royaltySuccess, "Royalty payment failed");
        }

        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }
    }

    /**
     * @dev Internal function to get royalty information
     */
    function _getRoyaltyInfo(Listing memory listing) internal view returns (address, uint256) {
        if (IERC165(listing.nftContract).supportsInterface(0x2a55205a)) {
            return IERC2981(listing.nftContract).royaltyInfo(listing.tokenId, listing.price);
        }
        return (address(0), 0);
    }

    /**
     * @dev Update listing price (only seller)
     */
    function updateListing(uint256 listingId, uint256 newPrice) external validListing(listingId) {
        require(newPrice > 0, "Price must be > 0");
        require(listings[listingId].seller == msg.sender, "Not listing owner");

        listings[listingId].price = newPrice;

        emit ListingUpdated(listingId, newPrice);
    }

    /**
     * @dev Cancel listing (only seller)
     */
    function cancelListing(uint256 listingId) external validListing(listingId) {
        require(listings[listingId].seller == msg.sender, "Not listing owner");

        listings[listingId].active = false;
        tokenToListing[listings[listingId].tokenId] = 0;

        emit ListingCanceled(listingId);
    }

    /**
     * @dev Get active listings (paginated)
     */
    function getActiveListings(
        uint256 offset,
        uint256 limit
    ) external view returns (Listing[] memory, uint256[] memory) {
        require(limit <= 50, "Limit too high"); // Max 50 per query

        uint256 found = 0;
        uint256 currentIndex = offset + 1;

        // Count active listings first
        while (found < limit && currentIndex <= _listingCounter) {
            if (listings[currentIndex].active) {
                found++;
            }
            currentIndex++;
        }

        // Create arrays with exact size
        Listing[] memory result = new Listing[](found);
        uint256[] memory resultIds = new uint256[](found);

        // Fill arrays
        found = 0;
        currentIndex = offset + 1;
        while (found < limit && currentIndex <= _listingCounter) {
            if (listings[currentIndex].active) {
                result[found] = listings[currentIndex];
                resultIds[found] = currentIndex;
                found++;
            }
            currentIndex++;
        }

        return (result, resultIds);
    }

    /**
     * @dev Get current listing counter
     */
    function getCurrentListingId() external view returns (uint256) {
        return _listingCounter;
    }

    /**
     * @dev Set auction contract address
     */
    function setAuctionContract(address _auctionContract) external onlyOwner {
        luminaAuctionContract = _auctionContract;
    }

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 _platformFeeBps) external onlyOwner {
        require(_platformFeeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = _platformFeeBps;
    }

    /**
     * @dev Withdraw platform fees
     */
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Pause/unpause platform
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
