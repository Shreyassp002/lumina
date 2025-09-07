'use server';

import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
        }

        const formData = await request.formData();
        const image = formData.get('image');
        const name = formData.get('name') || '';
        const description = formData.get('description') || '';
        const attributesRaw = formData.get('attributes');
        const category = formData.get('category') || '';

        if (!image || typeof image === 'string') {
            return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
        }

        // Read Pinata JWT from env
        const PINATA_JWT = process.env.PINATA_JWT;
        if (!PINATA_JWT) {
            throw new Error('Missing PINATA_JWT environment variable');
        }

        // Use original image File from the request for multipart upload
        const imageFileName = image.name || `asset-${Date.now()}`;

        // Parse attributes if provided
        let attributes = [];
        if (attributesRaw) {
            try {
                attributes = JSON.parse(attributesRaw);
                if (!Array.isArray(attributes)) attributes = [];
            } catch { }
        }

        // Upload image to Pinata (with retry + timeout)
        const imageForm = new FormData();
        imageForm.append('file', image, imageFileName);
        imageForm.append('pinataMetadata', JSON.stringify({ name: imageFileName }));
        imageForm.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

        const fetchWithRetry = async (url, init, attempts = 3, timeoutMs = 30000) => {
            let lastErr;
            for (let i = 0; i < attempts; i++) {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeoutMs);
                try {
                    const res = await fetch(url, { ...init, signal: controller.signal });
                    clearTimeout(timer);
                    if (res.ok) return res;
                    lastErr = new Error(await res.text());
                } catch (e) {
                    lastErr = e;
                }
                // backoff
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
            throw lastErr || new Error('Request failed');
        };

        const imageRes = await fetchWithRetry(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            { method: 'POST', headers: { Authorization: `Bearer ${PINATA_JWT}` }, body: imageForm }
        );
        const imageJson = await imageRes.json();
        const imageCID = imageJson.IpfsHash;
        const imageURI = `ipfs://${imageCID}`;

        // Build metadata
        const metadataObj = {
            name,
            description,
            image: imageURI,
            attributes: [
                { trait_type: 'category', value: category },
                ...attributes,
            ],
        };

        // Pin metadata JSON to Pinata
        const metaRes = await fetchWithRetry(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${PINATA_JWT}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pinataMetadata: { name: `metadata-${Date.now()}` }, pinataContent: metadataObj }),
            }
        );
        const metaJson = await metaRes.json();
        const metadataCID = metaJson.IpfsHash;
        const metadataURI = `ipfs://${metadataCID}`;

        return NextResponse.json({ ok: true, metadataURI, imageURI, cid: metadataCID });
    } catch (err) {
        console.error('IPFS upload error:', err);
        return NextResponse.json({ error: 'Upload failed', details: String(err.message || err) }, { status: 500 });
    }
}


