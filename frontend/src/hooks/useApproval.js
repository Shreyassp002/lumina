'use client';

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { LUMINA_NFT_ABI, LUMINA_NFT_ADDRESS } from '../../abi/luminaNft';
import { LUMINA_MARKETPLACE_ADDRESS } from '../../abi/luminaMarketplace';
import { LUMINA_AUCTION_ADDRESS } from '../../abi/luminaAuction';

// Hook to check if marketplace is approved for a token
export function useMarketplaceApproval(tokenId, owner) {
    return useReadContract({
        address: LUMINA_NFT_ADDRESS,
        abi: LUMINA_NFT_ABI,
        functionName: 'getApproved',
        args: tokenId ? [tokenId] : undefined,
        query: {
            enabled: !!tokenId && !!owner,
        },
    });
}

// Hook to check if auction contract is approved for a token
export function useAuctionApproval(tokenId, owner) {
    return useReadContract({
        address: LUMINA_NFT_ADDRESS,
        abi: LUMINA_NFT_ABI,
        functionName: 'isApprovedForAll',
        args: owner ? [owner, LUMINA_AUCTION_ADDRESS] : undefined,
        query: {
            enabled: !!owner && !!tokenId,
        },
    });
}

// Hook to approve marketplace for a specific token
export function useApproveMarketplace() {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const approveMarketplace = async (tokenId) => {
        try {
            await writeContract({
                address: LUMINA_NFT_ADDRESS,
                abi: LUMINA_NFT_ABI,
                functionName: 'approve',
                args: [LUMINA_MARKETPLACE_ADDRESS, tokenId],
            });
        } catch (error) {
            console.error('Marketplace approval failed:', error);
            throw error;
        }
    };

    return {
        approveMarketplace,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
    };
}

// Hook to approve auction contract for all tokens
export function useApproveAuction() {
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const approveAuction = async () => {
        try {
            await writeContract({
                address: LUMINA_NFT_ADDRESS,
                abi: LUMINA_NFT_ABI,
                functionName: 'setApprovalForAll',
                args: [LUMINA_AUCTION_ADDRESS, true],
            });
        } catch (error) {
            console.error('Auction approval failed:', error);
            throw error;
        }
    };

    return {
        approveAuction,
        isPending,
        isConfirming,
        isConfirmed,
        hash,
    };
}
