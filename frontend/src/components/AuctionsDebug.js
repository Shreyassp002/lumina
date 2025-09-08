import { usePublicClient } from 'wagmi';
import { useState } from 'react';
import { LUMINA_AUCTION_ABI, LUMINA_AUCTION_ADDRESS } from '../../abi/luminaAuction';

export default function AuctionsDebug() {
    const publicClient = usePublicClient();
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    const convert = (obj) => {
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(convert);
        if (obj && typeof obj === 'object') {
            const out = {};
            for (const [k, v] of Object.entries(obj)) out[k] = convert(v);
            return out;
        }
        return obj;
    };

    const check = async () => {
        setLoading(true);
        try {
            const currentAuctionId = await publicClient.readContract({
                address: LUMINA_AUCTION_ADDRESS,
                abi: LUMINA_AUCTION_ABI,
                functionName: 'getCurrentAuctionId',
                args: [],
            });
            const count = Number(currentAuctionId || 0);
            const ids = Array.from({ length: count }, (_, i) => i + 1);
            const auctions = await Promise.all(
                ids.map((id) =>
                    publicClient
                        .readContract({ address: LUMINA_AUCTION_ADDRESS, abi: LUMINA_AUCTION_ABI, functionName: 'auctions', args: [id] })
                        .then((a) => ({ id, a }))
                        .catch(() => null)
                )
            );
            setInfo({
                timestamp: new Date().toLocaleString(),
                currentAuctionId: count,
                auctions: convert(auctions.filter(Boolean)),
            });
        } catch (e) {
            setInfo({ error: String(e?.message || e) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-emerald-200">Auctions Debug</h3>
            <button onClick={check} disabled={loading} className="mb-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-lime-500 text-black rounded-lg hover:from-emerald-400 hover:to-lime-400 disabled:opacity-50">
                {loading ? 'Checking...' : 'Check Auctions'}
            </button>
            {info && (
                <div className="space-y-2 text-sm">
                    {info.error ? (
                        <div className="text-red-400">{info.error}</div>
                    ) : (
                        <>
                            <div><span className="text-emerald-300">Timestamp:</span> {info.timestamp}</div>
                            <div><span className="text-emerald-300">Current Auction ID:</span> {info.currentAuctionId}</div>
                            <div className="mt-2">
                                <span className="text-emerald-300">Auctions:</span>
                                <pre className="mt-2 p-2 bg-[#0e1518] rounded text-xs overflow-auto">{JSON.stringify(info.auctions, null, 2)}</pre>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
