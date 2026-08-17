// Screen Types

export type ConnectionStatus = 'Online' | 'Offline' | 'Unknown';
export type OperationalStatus = 'Draft' | 'Active' | 'Inactive';

export interface Screen {
  id: number;
  clientId: number;
  name: string;
  externalId?: string;
  locationName?: string;
  city?: string;
  connectionStatus: ConnectionStatus;
  operationalStatus: OperationalStatus;
  lastHeartbeatAtUtc?: string;
  cameraEnabled: boolean;
  aiEnabled: boolean;
  cameraId?: number;
  lastSyncRequestedAtUtc?: string;
  lastSupportAction?: string;
  currentCampaignId?: number;
  campaignIds: number[];
  currentMediaAssetId?: number;
  // Campaign ad fields
  boysKidsMediaAssetId?: number;
  girlsKidsMediaAssetId?: number;
  menMediaAssetId?: number;
  womenMediaAssetId?: number;
  defaultMediaAssetId?: number;
  // Currently displayed ad fields
  currentBoysKidsMediaAssetId?: number;
  currentGirlsKidsMediaAssetId?: number;
  currentMenMediaAssetId?: number;
  currentWomenMediaAssetId?: number;
  currentDefaultMediaAssetId?: number;
}

export interface CreateScreenInput {
  clientId: number;
  name: string;
  externalId?: string;
  locationName?: string;
  city?: string;
  cameraEnabled?: boolean;
  aiEnabled?: boolean;
  cameraId?: number;
}

export interface UpdateScreenInput {
  clientId?: number;
  name?: string;
  externalId?: string;
  locationName?: string;
  location?: string;
  city?: string;
  connectionStatus?: ConnectionStatus;
  operationalStatus?: OperationalStatus;
  cameraEnabled?: boolean;
  aiEnabled?: boolean;
  cameraId?: number;
  currentCampaignId?: number;
  campaignIds?: number[];
}

// Screen Current Media
export interface ScreenCurrentMedia {
  screenId: number;
  currentCampaignId?: number;
  currentMediaAssetId?: number;
  currentMediaAssetDuration?: number | null;
  currentMediaAssetName?: string;
  currentMediaAssetType?: string;
  url?: string;
  currentBoysKidsMediaAssetId?: number;
  currentBoysKidsMediaUrl?: string;
  currentBoysKidsMediaDuration?: number | null;
  currentBoysKidsMediaAssetName?: string;
  currentBoysKidsMediaAssetType?: string;
  currentGirlsKidsMediaAssetId?: number;
  currentGirlsKidsMediaUrl?: string;
  currentGirlsKidsMediaDuration?: number | null;
  currentGirlsKidsMediaAssetName?: string;
  currentGirlsKidsMediaAssetType?: string;
  currentMenMediaAssetId?: number;
  currentMenMediaUrl?: string;
  currentMenMediaDuration?: number | null;
  currentMenMediaAssetName?: string;
  currentMenMediaAssetType?: string;
  currentWomenMediaAssetId?: number;
  currentWomenMediaUrl?: string;
  currentWomenMediaDuration?: number | null;
  currentWomenMediaAssetName?: string;
  currentWomenMediaAssetType?: string;
  currentDefaultMediaAssetId?: number;
  currentDefaultMediaUrl?: string;
  currentDefaultMediaDuration?: number | null;
  currentDefaultMediaAssetName?: string;
  currentDefaultMediaAssetType?: string;
}

// Screen Active Campaign
export interface ScreenActiveCampaign {
  screenId: number;
  currentCampaignId?: number;
  ruleApplied: boolean;
  checkedAtUtc: string;
  campaign?: {
    id: number;
    clientId: number;
    name: string;
    description?: string;
    startsAtUtc: string;
    endsAtUtc: string;
    status: string;
    priority: number;
    daysOfWeek: string[];
    dayStartsAt: string;
    dayEndsAt: string;
    boysKidsMediaAssetId: number;
    girlsKidsMediaAssetId: number;
    menMediaAssetId: number;
    womenMediaAssetId: number;
    defaultMediaAssetId: number;
  };
}

// Media Slot
export type MediaSlot = 'BoysKids' | 'GirlsKids' | 'Men' | 'Women' | 'Default';

export interface MediaSlotInfo {
  slot: MediaSlot;
  mediaAssetId: number;
  mediaAssetName: string;
  mediaAssetType: 'Image' | 'Video';
  mediaAssetUrl: string;
}

export interface ScreenMediaSlots {
  screenId: number;
  clientId: number;
  screenStatus: string;
  mediaSlots: MediaSlotInfo[];
}

// Media Assignments for bulk update
export interface MediaAssignments {
  currentMediaAssetId?: number;
  boysKidsMediaAssetId: number;
  girlsKidsMediaAssetId: number;
  menMediaAssetId: number;
  womenMediaAssetId: number;
  defaultMediaAssetId: number;
}

// Active Scenario Types
export type ActiveScenarioType = 'campaign' | 'ai' | 'default';

export interface ActiveScenario {
  type: ActiveScenarioType;
  description: string;
  campaignName?: string;
  campaignId?: number;
  cameraName?: string;
  cameraId?: number;
}

// Bulk Assignment Types
export interface BulkCampaignAssignmentRequest {
  screenIds: number[];
  campaignId: number;
}

export interface BulkAssignmentResult {
  totalScreens: number;
  successCount: number;
  failureCount: number;
  failures: Array<{
    screenId: number;
    screenName: string;
    error: string;
  }>;
}
