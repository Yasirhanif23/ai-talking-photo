export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { source_image, driving_video } = req.body;

    if (!source_image || !driving_video) {
        return res.status(400).json({ error: 'Source photo and driving reference video/audio are required.' });
    }

    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

    if (!REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: 'Replicate API Token is not configured in Vercel.' });
    }

    try {
        // Updated LivePortrait Prediction API Call
        const response = await fetch('https://api.replicate.com/v1/models/fofr/live-portrait/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: {
                    source_image: source_image,
                    driving_video: driving_video
                }
            })
        });

        const prediction = await response.json();

        if (response.status !== 201 && response.status !== 200) {
            return res.status(response.status).json({ error: prediction.detail || prediction.error || 'API Call Failed' });
        }

        let statusUrl = prediction.urls.get;
        let outputVideoUrl = null;

        // Poll for completion
        while (!outputVideoUrl) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const statusRes = await fetch(statusUrl, {
                headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
            });
            const statusJson = await statusRes.json();

            if (statusJson.status === 'succeeded') {
                outputVideoUrl = Array.isArray(statusJson.output) ? statusJson.output[0] : statusJson.output;
                break;
            } else if (statusJson.status === 'failed' || statusJson.status === 'canceled') {
                return res.status(500).json({ error: statusJson.error || 'AI Video Generation Failed.' });
            }
        }

        return res.status(200).json({ output_url: outputVideoUrl });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
