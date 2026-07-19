import { useCallback, useEffect, useState } from 'react';
import { subscriptionsApi } from '@/lib/api/subscriptions.api';
import type {
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  RenewSubscriptionInput,
  RenewSubscriptionDateInput,
} from '@/lib/types/superAdmin';

export function useSubscriptions(clientId?: number) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load client's active subscription
  const loadClientSubscription = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsApi.getClientSubscription(id);
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الاشتراك');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all subscriptions for a client
  const loadClientSubscriptions = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsApi.getByClientId(id);
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الاشتراكات');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new subscription
  const createSubscription = useCallback(async (payload: CreateSubscriptionInput) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsApi.create(payload);
      if (payload.clientId) {
        await loadClientSubscription(payload.clientId);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الاشتراك');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadClientSubscription]);

  // Update subscription
  const updateSubscription = useCallback(async (id: number, payload: UpdateSubscriptionInput) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsApi.update(id, payload);
      if (subscription?.clientId) {
        await loadClientSubscription(subscription.clientId);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الاشتراك');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription?.clientId, loadClientSubscription]);

  // Delete subscription
  const deleteSubscription = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await subscriptionsApi.delete(id);
      if (subscription?.clientId) {
        await loadClientSubscription(subscription.clientId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الاشتراك');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription?.clientId, loadClientSubscription]);

  // Renew subscription by days
  const renewByDays = useCallback(async (id: number, payload: RenewSubscriptionInput) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsApi.renewByDays(id, payload);
      if (subscription?.clientId) {
        await loadClientSubscription(subscription.clientId);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تجديد الاشتراك');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription?.clientId, loadClientSubscription]);

  // Renew subscription by date
  const renewByDate = useCallback(async (id: number, payload: RenewSubscriptionDateInput) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsApi.renewByDate(id, payload);
      if (subscription?.clientId) {
        await loadClientSubscription(subscription.clientId);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تجديد الاشتراك');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription?.clientId, loadClientSubscription]);

  // Update expiration status
  const updateExpirationStatus = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsApi.updateExpirationStatus(id);
      if (subscription?.clientId) {
        await loadClientSubscription(subscription.clientId);
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث حالة انتهاء الاشتراك');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription?.clientId, loadClientSubscription]);

  // Update expiration status by client
  const updateExpirationStatusByClient = useCallback(async (clientId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionsApi.updateExpirationStatusByClient(clientId);
      await loadClientSubscription(clientId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث حالة انتهاء الاشتراك');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadClientSubscription]);

  // Get remaining days
  const getRemainingDays = useCallback(async (id: number) => {
    try {
      const days = await subscriptionsApi.getRemainingDays(id);
      return days;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل جلب الأيام المتبقية');
      throw err;
    }
  }, []);

  // Auto-load subscription when clientId changes
  useEffect(() => {
    if (clientId) {
      loadClientSubscription(clientId);
    }
  }, [clientId, loadClientSubscription]);

  return {
    subscription,
    subscriptions,
    loading,
    error,
    loadClientSubscription,
    loadClientSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    renewByDays,
    renewByDate,
    updateExpirationStatus,
    updateExpirationStatusByClient,
    getRemainingDays,
  };
}
