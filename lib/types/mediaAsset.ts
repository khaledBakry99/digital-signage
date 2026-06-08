export type MediaType = 'Image' | 'Video';

export interface MediaAsset {
  id: number;
  clientId: number;
  name: string;
  description: string;
  type: MediaType;
  url: string;
  durationSeconds: number;
  fileSizeMb: number;
  resolution: string;
  isFallback: boolean;
  createdAtUtc: string;
}

export interface CreateMediaAssetInput {
  clientId: number;
  name: string;
  description?: string;
  type: MediaType;
  isFallback?: boolean;
  file: File;
}

export interface UpdateMediaAssetInput {
  name?: string;
  description?: string;
  type?: MediaType;
  isFallback?: boolean;
}
