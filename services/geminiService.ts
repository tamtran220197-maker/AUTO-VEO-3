
import { GoogleGenAI } from "@google/genai";
import { VideoJob, VeoModel, InputType } from "../types";

export const generateVideo = async (job: VideoJob): Promise<string> => {
  // Always create a new instance to ensure we use the latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const config: any = {
      numberOfVideos: 1,
      resolution: job.resolution,
      aspectRatio: job.aspectRatio,
    };

    const payload: any = {
      model: job.model,
      prompt: job.prompt,
      config,
    };

    if (job.inputType === InputType.IMAGE_TO_VIDEO && job.startImage) {
      payload.image = {
        imageBytes: job.startImage.split(',')[1],
        mimeType: 'image/png',
      };
    }

    if (job.inputType === InputType.FRAMES_TO_VIDEO && job.startImage && job.endImage) {
      payload.image = {
        imageBytes: job.startImage.split(',')[1],
        mimeType: 'image/png',
      };
      payload.config.lastFrame = {
        imageBytes: job.endImage.split(',')[1],
        mimeType: 'image/png',
      };
    }

    let operation = await ai.models.generateVideos(payload);

    while (!operation.done) {
      // Poll every 10 seconds as video generation is intensive
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("No video URI returned from the operation.");
    }

    // Fetch the actual video content using the download link + API key
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_EXPIRED");
    }
    throw error;
  }
};
