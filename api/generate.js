export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { source_image, driving_video } = req.body || {};

    if (!source_image) {
      return res.status(400).json({
        error: "Source photo is required."
      });
    }

    if (!driving_video) {
      return res.status(400).json({
        error: "Driving video/audio is required."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Generate API is working.",
      source_image_received: true,
      driving_video_received: true
    });

  } catch (error) {
    console.error("Generate API Error:", error);

    return res.status(500).json({
      error: "Server error"
    });
  }
}