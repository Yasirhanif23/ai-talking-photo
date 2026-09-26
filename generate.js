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
        // LivePortrait Model on Replicate
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: "fbfb4cc233d69941a3cd4380eb0b36872a3922c1e7a57a550d5e165445f1b138",
                input: {
                    source_image: source_image,
                    driving_video: driving_video,
                    live_portrait_flag: true
                }
            })
        });

        const prediction = await response.json();

        if (response.status !== 201) {
            return res.status(response.status).json({ error: prediction.detail || 'API Call Failed' });
        }

        // Poll prediction status until finished
        let statusUrl = prediction.urls.get;
        let outputVideoUrl = null;

        while (!outputVideoUrl) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const statusRes = await fetch(statusUrl, {
                headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
            });
            const statusJson = await statusRes.json();

            if (statusJson.status === 'succeeded') {
                outputVideoUrl = statusJson.output;
                break;
            } else if (statusJson.status === 'failed' || statusJson.status === 'canceled') {
                return res.status(500).json({ error: 'AI Video Generation Failed.' });
            }
        }

        return res.status(200).json({ output_url: outputVideoUrl });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}