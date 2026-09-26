import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { source_image, driving_video } = req.body || {};

    if (!source_image) {
      return res.status(400).json({
        error: "Source photo is required.",
      });
    }

    if (!driving_video) {
      return res.status(400).json({
        error: "Audio is required.",
      });
    }

    const output = await replicate.run(
      "cjwbw/sadtalker:a519cc0cfebaaeade068b23899165a11ec76aaa1d2b313d40d214f204ec957a3",
      {
        input: {
          source_image: source_image,
          driven_audio: driving_video,
          facerender: "facevid2vid",
          pose_style: 0,
          preprocess: "crop",
          still_mode: true,
          use_enhancer: true,
          use_eyeblink: true,
          size_of_image: 256,
          expression_scale: 1,
        },
      }
    );

    const outputUrl =
      typeof output === "string"
        ? output
        : output?.url
          ? output.url()
          : String(output);

    if (!outputUrl || outputUrl === "undefined") {
      return res.status(500).json({
        error: "AI model did not return a video URL.",
      });
    }

    return res.status(200).json({
      success: true,
      output_url: outputUrl,
    });

  } catch (error) {
    console.error("Replicate Error:", error);

    return res.status(500).json({
      error: error?.message || "AI video generation failed.",
    });
  }
}