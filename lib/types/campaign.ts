// Campaign Types

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Ready' | 'Active' | 'Paused' | 'Completed';
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface Campaign {
  id: number;
  clientId: number;
  name: string;
  description?: string;
  startsAtUtc: string;
  endsAtUtc: string;
  status: CampaignStatus;
  priority: number;
  daysOfWeek: DayOfWeek[];
  dayStartsAt: string;
  dayEndsAt: string;
  boysKidsMediaAssetId: number;
  girlsKidsMediaAssetId: number;
  menMediaAssetId: number;
  womenMediaAssetId: number;
  defaultMediaAssetId: number;
}

export interface CreateCampaignInput {
  clientId: number;
  name: string;
  description?: string;
  status?: CampaignStatus;
  startsAtUtc: string;
  endsAtUtc: string;
  priority: number;
  daysOfWeek: DayOfWeek[];
  dayStartsAt: string;
  dayEndsAt: string;
  boysKidsMediaAssetId: number;
  girlsKidsMediaAssetId: number;
  menMediaAssetId: number;
  womenMediaAssetId: number;
  defaultMediaAssetId: number;
}

export interface UpdateCampaignInput {
  id?: number;
  name?: string;
  description?: string;
  startsAtUtc?: string;
  endsAtUtc?: string;
  status?: CampaignStatus;
  priority?: number;
  daysOfWeek?: DayOfWeek[];
  dayStartsAt?: string;
  dayEndsAt?: string;
  boysKidsMediaAssetId?: number;
  girlsKidsMediaAssetId?: number;
  menMediaAssetId?: number;
  womenMediaAssetId?: number;
  defaultMediaAssetId?: number;
}
