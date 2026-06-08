import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '@/lib/types/campaign';

const CAMPAIGNS_STORAGE_KEY = 'digital_signage_campaigns';

class CampaignService {
  private getCampaigns(): Campaign[] {
    if (typeof window === 'undefined') return [];
    
    const data = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (!data) return [];
    
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveCampaigns(campaigns: Campaign[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  }

  getAll(): Campaign[] {
    return this.getCampaigns();
  }

  getById(id: string | number): Campaign | null {
    const campaigns = this.getCampaigns();
    return campaigns.find(c => String(c.id) === String(id)) || null;
  }

  create(input: CreateCampaignInput): Campaign {
    const campaigns = this.getCampaigns();
    
    const newCampaign: Campaign = {
      id: Date.now(),
      status: 'Draft',
      ...input,
    };

    campaigns.push(newCampaign);
    this.saveCampaigns(campaigns);
    
    return newCampaign;
  }

  update(input: UpdateCampaignInput): Campaign | null {
    const campaigns = this.getCampaigns();
    const index = campaigns.findIndex(c => c.id === input.id);
    
    if (index === -1) return null;

    const updatedCampaign: Campaign = {
      ...campaigns[index],
      ...input,
    } as Campaign;

    campaigns[index] = updatedCampaign;
    this.saveCampaigns(campaigns);
    
    return updatedCampaign;
  }

  delete(id: string | number): boolean {
    const campaigns = this.getCampaigns();
    const filteredCampaigns = campaigns.filter(c => String(c.id) !== String(id));
    
    if (filteredCampaigns.length === campaigns.length) {
      return false;
    }

    this.saveCampaigns(filteredCampaigns);
    return true;
  }

  getActiveCampaigns(): Campaign[] {
    const campaigns = this.getCampaigns();
    const now = new Date();
    
    return campaigns.filter(c => {
      const startsAt = new Date(c.startsAtUtc);
      const endsAt = new Date(c.endsAtUtc);
      
      return now >= startsAt && now <= endsAt;
    });
  }
}

export const campaignService = new CampaignService();
