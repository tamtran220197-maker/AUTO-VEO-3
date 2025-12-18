
export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum InputType {
  TEXT_ONLY = 'TEXT_ONLY',
  IMAGE_TO_VIDEO = 'IMAGE_TO_VIDEO',
  FRAMES_TO_VIDEO = 'FRAMES_TO_VIDEO'
}

export enum VeoModel {
  VEO_3_1_FAST = 'veo-3.1-fast-generate-preview',
  VEO_3_1_HQ = 'veo-3.1-generate-preview'
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type Resolution = '720p' | '1080p';

export interface VideoJob {
  id: string;
  prompt: string;
  inputType: InputType;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  startImage?: string; // base64
  endImage?: string;   // base64
  status: JobStatus;
  progress: number;
  videoUrl?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface QueueConfig {
  maxConcurrent: number;
  maxPerMinute: number;
}
