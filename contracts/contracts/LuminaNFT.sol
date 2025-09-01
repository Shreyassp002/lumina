// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LuminaNFT
 * @dev Core NFT contract for Lumina platform
 * Handles minting, creator attribution, and royalties
 */
contract LuminaNFT is ERC721, ERC721Royalty, Ownable, Pausable, ReentrancyGuard {
    struct TokenData {
        address creator; // Original creator
        string metadataURI; // IPFS hash for metadata
        uint256 royaltyBps; // Royalty in basis points (1000 = 10%)
        uint256 mintTimestamp; // When it was minted
        string category; // Art category
        bool isVerifiedCreator; // Creator verification status
    }

    struct CreatorProfile {
        string name;
        string bio;
        string socialLink;
        bool verified;
        uint256 totalMinted;
        uint256 totalEarned;
    }

    // State variables
    uint256 private _tokenCounter;
    mapping(uint256 => TokenData) public tokenData;
    mapping(address => CreatorProfile) public creatorProfiles;
    mapping(address => bool) public verifiedCreators;
    mapping(string => bool) public usedURIs; // Prevent duplicate URIs

    // Platform settings
    uint256 public maxRoyaltyBps = 1000; // 10% max royalty
    uint256 public mintFee = 0.001 ether; // Platform mint fee
    address public marketplaceContract;

    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string metadataURI,
        string category
    );
    event CreatorVerified(address indexed creator);
    event CreatorProfileUpdated(address indexed creator);
    event RoyaltyUpdated(uint256 indexed tokenId, uint256 royaltyBps);

    constructor() ERC721("Lumina", "LUMINA") Ownable(msg.sender) {}

    /**
     * @dev Mint a new NFT
     * @param metadataURI IPFS URI for token metadata
     * @param royaltyBps Royalty percentage in basis points
     * @param category Art category
     */
    function mintNFT(
        string memory metadataURI,
        uint256 royaltyBps,
        string memory category
    ) external payable nonReentrant whenNotPaused {
        require(bytes(metadataURI).length > 0, "Empty metadata URI");
        require(!usedURIs[metadataURI], "URI already used");
        require(royaltyBps <= maxRoyaltyBps, "Royalty too high");
        require(msg.value >= mintFee, "Insufficient mint fee");

        _tokenCounter++;
        uint256 tokenId = _tokenCounter;

        // Mint the NFT
        _safeMint(msg.sender, tokenId);

        // Set royalty
        _setTokenRoyalty(tokenId, msg.sender, uint96(royaltyBps));

        // Store token data
        tokenData[tokenId] = TokenData({
            creator: msg.sender,
            metadataURI: metadataURI,
            royaltyBps: royaltyBps,
            mintTimestamp: block.timestamp,
            category: category,
            isVerifiedCreator: verifiedCreators[msg.sender]
        });

        // Mark URI as used
        usedURIs[metadataURI] = true;

        // Update creator profile
        creatorProfiles[msg.sender].totalMinted++;

        emit NFTMinted(tokenId, msg.sender, metadataURI, category);
    }

    /**
     * @dev Update creator profile
     */
    function updateCreatorProfile(
        string memory name,
        string memory bio,
        string memory socialLink
    ) external {
        CreatorProfile storage profile = creatorProfiles[msg.sender];
        profile.name = name;
        profile.bio = bio;
        profile.socialLink = socialLink;

        emit CreatorProfileUpdated(msg.sender);
    }

    /**
     * @dev Verify creator (only owner)
     */
    function verifyCreator(address creator) external onlyOwner {
        verifiedCreators[creator] = true;
        creatorProfiles[creator].verified = true;

        emit CreatorVerified(creator);
    }

    /**
     * @dev Set marketplace contract address
     */
    function setMarketplaceContract(address _marketplace) external onlyOwner {
        marketplaceContract = _marketplace;
    }

    /**
     * @dev Update token royalty (only token creator)
     */
    function updateTokenRoyalty(uint256 tokenId, uint256 royaltyBps) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(tokenData[tokenId].creator == msg.sender, "Not token creator");
        require(royaltyBps <= maxRoyaltyBps, "Royalty too high");

        _setTokenRoyalty(tokenId, msg.sender, uint96(royaltyBps));
        tokenData[tokenId].royaltyBps = royaltyBps;

        emit RoyaltyUpdated(tokenId, royaltyBps);
    }

    /**
     * @dev Get token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenData[tokenId].metadataURI;
    }

    /**
     * @dev Get current token ID
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenCounter;
    }

    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw platform fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Update mint fee
     */
    function setMintFee(uint256 _mintFee) external onlyOwner {
        mintFee = _mintFee;
    }

    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
