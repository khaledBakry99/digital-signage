// Gender AI Types

export type Gender = 'Male' | 'Female' | 'Unknown';
export type AgeGroup = 'Child' | 'Teen' | 'Adult' | 'Senior' | 'Unknown';
export type Audience = 'BoysKids' | 'GirlsKids' | 'Men' | 'Women' | 'Mixed' | 'Unknown';
export type Slot = 'BoysKids' | 'GirlsKids' | 'Men' | 'Women' | 'Default';

export interface GenderAiDetection {
  gender: Gender;
  age: number;
  ageGroup: AgeGroup;
  slot: Slot;
  personConfidence: number;
  genderConfidence: number;
  ageConfidence: number;
  isNiqab: boolean;
}

export interface GenderAiImage {
  width: number;
  height: number;
  filename: string;
}

export interface GenderAiScreenUpdate {
  screenId: number;
  screenName: string;
  aiEnabled: boolean;
  updated: boolean;
  previousMediaAssetId: number;
  currentMediaAssetId: number;
  selectedSlot: Slot;
  usedFallback: boolean;
  message: string;
}

export interface GenderAiResponse {
  cameraId: number;
  gender: Gender;
  ageGroup: AgeGroup;
  audience: Audience;
  selectedSlot: Slot;
  peopleCount: number;
  confidence: number;
  elapsedMs: number;
  image: GenderAiImage;
  detections: GenderAiDetection[];
  updatedScreens: GenderAiScreenUpdate[];
}

export interface GenderAiInput {
  cameraId: number;
  image: File;
  niqabThreshold?: number;
  childConfThreshold?: number;
}
