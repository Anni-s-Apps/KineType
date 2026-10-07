import * as Mp4Muxer from 'mp4-muxer';
import { Recipe } from '../types/recipe';
import { renderFrame, AssetMap } from '../render/renderer';

export interface ExportProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  etaSeconds: number;
  status: string;
}

export interface VideoExportOptions {
  recipe: Recipe;
  assets: AssetMap;
  audioBlob?: Blob | null;
  quality?: '1080p' | '720p';
  onProgress?: (progress: ExportProgress) => void;
  signal?: AbortSignal;
}

/**
 * High-performance MP4 Video Export Engine using WebCodecs & mp4-muxer
 */
export async function exportRecipeToMp4(options: VideoExportOptions): Promise<Blob> {
  const { recipe, assets, audioBlob, onProgress, signal } = options;

  const fps = recipe.settings?.fps || 30;
  const duration = recipe.settings?.duration || 10;
  const totalFrames = Math.ceil(duration * fps);

  // Aspect ratio resolution
  const isPortrait = recipe.settings?.aspect === '9:16';
  const width = isPortrait ? 1080 : 1920;
  const height = isPortrait ? 1920 : 1080;

  // Create offscreen canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  if (!ctx) {
    throw new Error('Failed to create canvas 2D rendering context');
  }

  // Check WebCodecs VideoEncoder support
  if (typeof VideoEncoder === 'undefined') {
    return exportViaMediaRecorder(canvas, ctx, recipe, assets, totalFrames, fps, duration, onProgress);
  }

  const startTimeMs = performance.now();

  // Initialize mp4-muxer
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width,
      height,
    },
    audio: audioBlob
      ? {
          codec: 'aac',
          numberOfChannels: 2,
          sampleRate: 48000,
        }
      : undefined,
    fastStart: 'in-memory',
  });

  // Setup VideoEncoder
  let encodedFrames = 0;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
      encodedFrames++;
    },
    error: (e) => {
      console.error('VideoEncoder error:', e);
    },
  });

  await videoEncoder.configure({
    codec: 'avc1.640028', // H.264 High Profile
    width,
    height,
    bitrate: 18_000_000, // 18 Mbps high quality
    framerate: fps,
  });

  // Encode Audio if provided
  if (audioBlob) {
    try {
      await encodeAudioTrack(audioBlob, muxer, duration);
    } catch (err) {
      console.warn('Audio muxing warning (proceeding with video only):', err);
    }
  }

  // Render & Encode frames one by one
  for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
    if (signal?.aborted) {
      videoEncoder.close();
      throw new Error('Export cancelled by user');
    }

    const t = frameIdx / fps;

    // Pure frame render
    renderFrame(ctx, recipe, assets, t, {
      width,
      height,
      showSafeAreas: false,
    });

    // Create VideoFrame from canvas
    const videoFrame = new VideoFrame(canvas, {
      timestamp: (frameIdx * 1_000_000) / fps, // microseconds
      duration: 1_000_000 / fps,
    });

    // Keyframe every 2 seconds
    const keyFrame = frameIdx % (fps * 2) === 0;
    videoEncoder.encode(videoFrame, { keyFrame });
    videoFrame.close();

    // Progress updates
    if (frameIdx % 5 === 0 || frameIdx === totalFrames - 1) {
      const elapsed = (performance.now() - startTimeMs) / 1000;
      const progressRatio = (frameIdx + 1) / totalFrames;
      const estimatedTotalTime = elapsed / progressRatio;
      const etaSeconds = Math.max(0, Math.round(estimatedTotalTime - elapsed));
      const percent = Math.round(progressRatio * 100);

      onProgress?.({
        percent,
        currentFrame: frameIdx + 1,
        totalFrames,
        fps,
        etaSeconds,
        status: `Rendering frame ${frameIdx + 1} of ${totalFrames}...`,
      });

      // Yield event loop slightly to keep UI responsive
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // Flush video encoder
  await videoEncoder.flush();
  videoEncoder.close();

  // Finalize MP4 muxer
  muxer.finalize();
  const { buffer } = muxer.target;
  return new Blob([buffer], { type: 'video/mp4' });
}

/**
 * Decodes and encodes audio with AudioEncoder into the MP4 muxer
 */
async function encodeAudioTrack(audioBlob: Blob, muxer: any, maxDuration: number) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 48000,
  });

  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  if (typeof AudioEncoder === 'undefined') {
    return;
  }

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => console.error('AudioEncoder error:', e),
  });

  audioEncoder.configure({
    codec: 'mp4a.40.2', // AAC LC
    numberOfChannels: 2,
    sampleRate: 48000,
    bitrate: 192000,
  });

  const channels = Math.min(2, audioBuffer.numberOfChannels);
  const sampleRate = audioBuffer.sampleRate;
  const channelData: Float32Array[] = [];

  for (let c = 0; c < 2; c++) {
    channelData.push(audioBuffer.getChannelData(c < channels ? c : 0));
  }

  // Chunk audio into 1024 sample slices
  const sliceSize = 1024;
  const maxSamples = Math.min(channelData[0].length, Math.ceil(maxDuration * sampleRate));

  for (let i = 0; i < maxSamples; i += sliceSize) {
    const currentSlice = Math.min(sliceSize, maxSamples - i);
    const planarData = new Float32Array(currentSlice * 2);

    planarData.set(channelData[0].subarray(i, i + currentSlice), 0);
    planarData.set(channelData[1].subarray(i, i + currentSlice), currentSlice);

    const audioData = new (window as any).AudioData({
      format: 'f32-planar',
      sampleRate: 48000,
      numberOfFrames: currentSlice,
      numberOfChannels: 2,
      timestamp: (i * 1_000_000) / sampleRate,
      data: planarData,
    });

    audioEncoder.encode(audioData);
    audioData.close();
  }

  await audioEncoder.flush();
  audioEncoder.close();
  await audioContext.close();
}

/**
 * Fallback recorder using MediaRecorder if WebCodecs is not available
 */
async function exportViaMediaRecorder(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  recipe: Recipe,
  assets: AssetMap,
  totalFrames: number,
  fps: number,
  _duration: number,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const stream = canvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  mediaRecorder.start();

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    renderFrame(ctx, recipe, assets, t, {
      width: canvas.width,
      height: canvas.height,
    });

    if (i % 10 === 0) {
      onProgress?.({
        percent: Math.round((i / totalFrames) * 100),
        currentFrame: i,
        totalFrames,
        fps,
        etaSeconds: 0,
        status: `Rendering frame ${i}/${totalFrames}...`,
      });
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
  }

  mediaRecorder.stop();
  return recordingPromise;
}
