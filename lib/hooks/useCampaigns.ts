import { useState, useEffect } from 'react';
import { campaignApi } from '@/lib/api/campaign.api';
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '@/lib/types/campaign';

export function useCampaigns(params?: { clientId?: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignApi.getAll(params);
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل جلب الحملات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [params?.clientId]);

  const createCampaign = async (input: CreateCampaignInput) => {
    try {
      const newCampaign = await campaignApi.create(input);
      setCampaigns(prev => [...prev, newCampaign]);
      return newCampaign;
    } catch (err) {
      throw err;
    }
  };

  const updateCampaign = async (id: number, data: Partial<UpdateCampaignInput>) => {
    try {
      const updated = await campaignApi.update(id, data);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteCampaign = async (id: number) => {
    try {
      await campaignApi.delete(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      throw err;
    }
  };

  const activateCampaign = async (id: number) => {
    try {
      const updated = await campaignApi.activate(id);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const pauseCampaign = async (id: number) => {
    try {
      const updated = await campaignApi.pause(id);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const completeCampaign = async (id: number) => {
    try {
      const updated = await campaignApi.complete(id);
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const getCampaignById = (id: number) => {
    return campaigns.find(c => c.id === id) || null;
  };

  return {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    activateCampaign,
    pauseCampaign,
    completeCampaign,
    getCampaignById,
    refreshCampaigns: loadCampaigns,
  };
}
