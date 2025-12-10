export interface OCRResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

export type CaseType = 
  | 'lowercase'
  | 'uppercase' 
  | 'capitalcase'
  | 'camelcase'
  | 'pascalcase'
  | 'snakecase'
  | 'kebabcase'
  | 'constantcase'
  | 'dotcase'
  | 'pathcase'
  | 'sentencecase'
  | 'titlecase';

export interface ConversionHistory {
  id: string;
  original: string;
  converted: string;
  caseType: CaseType;
  timestamp: Date;
}

export interface AppState {
  inputText: string;
  outputText: string;
  selectedCase: CaseType;
  isProcessing: boolean;
  ocrProgress: OCRProgress | null;
  history: ConversionHistory[];
  darkMode: boolean;
}

// Image processing types
export type ImageFormat = 'jpeg' | 'png' | 'webp';
export type UpscaleAlgorithm = 'bicubic' | 'lanczos' | 'nearest' | 'bilinear';
export type BackgroundRemovalType = 'ai' | 'advanced';
export type WatermarkRemovalMethod = 'inpaint' | 'blur' | 'clone' | 'frequency' | 'ai';

// Media download types
export type MediaQuality = '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | 'best' | 'worst';
export type AudioQuality = '64kbps' | '128kbps' | '192kbps' | '256kbps' | '320kbps' | 'best';
export type MediaFormat = 'mp4' | 'webm' | 'mkv' | 'avi' | 'mov' | 'flv';
export type AudioFormat = 'mp3' | 'aac' | 'ogg' | 'wav' | 'm4a' | 'flac';
export type PlatformType = 'youtube' | 'instagram' | 'twitter' | 'tiktok' | 'facebook' | 'vimeo' | 'generic';

export interface ImageProcessingOptions {
  quality?: number;
  backgroundColor?: string;
  segmentationThreshold?: number;
  maskBlurAmount?: number;
  edgeBlurAmount?: number;
  flipHorizontal?: boolean;
  upscaleFactor?: number;
  upscaleAlgorithm?: UpscaleAlgorithm;
  backgroundRemovalType?: BackgroundRemovalType;
  colorTolerance?: number;
  edgeThreshold?: number;
  smoothing?: number;
}

export interface WatermarkRemovalOptions {
  method: WatermarkRemovalMethod;
  watermarkRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  blurIntensity?: number;
  inpaintRadius?: number;
  threshold?: number;
  iterations?: number;
  autoDetect?: boolean;
}

export interface MediaDownloadOptions {
  quality: MediaQuality;
  format: MediaFormat;
  audioOnly?: boolean;
  audioQuality?: AudioQuality;
  audioFormat?: AudioFormat;
  extractAudio?: boolean;
  subtitles?: boolean;
  thumbnail?: boolean;
}

export interface MediaInfo {
  title: string;
  duration: number;
  thumbnail: string;
  platform: PlatformType;
  url: string;
  availableFormats: MediaFormat[];
  availableQualities: MediaQuality[];
  fileSize?: number;
  uploader?: string;
  uploadDate?: string;
  description?: string;
}

export interface DownloadProgress {
  stage: 'fetching' | 'downloading' | 'converting' | 'complete' | 'error';
  progress: number;
  message: string;
  downloadedBytes?: number;
  totalBytes?: number;
  speed?: string;
  eta?: string;
}

export interface ImageProcessingProgress {
  stage: 'loading' | 'processing' | 'converting' | 'complete';
  progress: number;
  message?: string;
}

export interface ProcessedImage {
  original: File;
  canvas: HTMLCanvasElement;
  dimensions: { width: number; height: number };
  processedAt: Date;
}
