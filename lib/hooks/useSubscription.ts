import { useState, useEffect } from 'react';
import { subscriptionsApi } from '@/lib/api/subscriptions.api';
import type { Subscription } from '@/lib/types/superAdmin';

export function useSubscription(clientId?: number) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);
        const subscriptions = await subscriptionsApi.getByClientId(clientId);
        // Get the active subscription if available
        const activeSub = subscriptions.find(sub => sub.status === 'Active') || subscriptions[0] || null;
        setSubscription(activeSub);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription';
        setError(errorMessage);
        console.error('Failed to fetch subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [clientId]);

  return {
    subscription,
    maxScreens: subscription?.maxScreens || 0,
    maxCameras: subscription?.maxCameras || 0,
    loading,
    error,
  };
}
