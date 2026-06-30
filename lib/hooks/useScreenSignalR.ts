import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnectionState } from "@microsoft/signalr";
import { signalRService } from "../services/signalRService";

interface ScreenMediaUpdatedEvent {
  screenId: number;
  currentMediaAssetId: number;
  selectedSlot: string;
  usedFallback: boolean;
  message: string;
  updatedAtUtc: string;
}

interface ScreenMediaRefreshEvent {
  screenId: number;
  campaignId?: number;
  reason: string;
  triggeredAtUtc: string;
}

/**
 * Hook للاستماع لأحداث SignalR الخاصة بالشاشات
 * 
 * @param screenId - رقم الشاشة
 * @param onMediaUpdated - callback عند تحديث الوسائط
 * @param onRefreshRequested - callback عند طلب تحديث
 */
export function useScreenSignalR(
  screenId: number,
  onMediaUpdated?: (event: ScreenMediaUpdatedEvent) => void,
  onRefreshRequested?: (event: ScreenMediaRefreshEvent) => void
) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);
  const connectionRef = useRef<ReturnType<typeof signalRService.getConnection> | null>(null);
  const joiningPromiseRef = useRef<Promise<void> | null>(null);

  const tryJoinScreen = useCallback(
    async (reason: string) => {
      const connection = connectionRef.current;

      if (!connection) {
        console.warn("⚠️ Cannot join screen group without SignalR connection");
        return;
      }

      if (connection.state !== HubConnectionState.Connected) {
        console.warn("⚠️ SignalR not connected yet, delaying JoinScreen", { screenId, state: connection.state, reason });
        return;
      }

      if (joinedRef.current) {
        return;
      }

      if (joiningPromiseRef.current) {
        return joiningPromiseRef.current;
      }

      const joinPromise = connection
        .invoke("JoinScreen", screenId)
        .then(() => {
          joinedRef.current = true;
          console.log(`✅ Joined screen group: ${screenId} (${reason})`);
        })
        .catch((err) => {
          console.error(`❌ Failed to join screen group ${screenId}:`, err);
          throw err;
        })
        .finally(() => {
          joiningPromiseRef.current = null;
        });

      joiningPromiseRef.current = joinPromise;
      return joinPromise;
    },
    [screenId]
  );

  useEffect(() => {
    let mounted = true;

    const handleScreenMediaUpdated = (event: ScreenMediaUpdatedEvent) => {
      if (event.screenId === screenId && onMediaUpdated) {
        console.log("📺 ScreenMediaUpdated:", event);
        onMediaUpdated(event);
      }
    };

    const handleScreenMediaRefreshRequested = (event: ScreenMediaRefreshEvent) => {
      if (event.screenId === screenId && onRefreshRequested) {
        console.log("🔄 ScreenMediaRefreshRequested:", event);
        onRefreshRequested(event);
      }
    };

    async function setupConnection() {
      try {
        // الحصول على token من localStorage
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found");
          return;
        }

        // الاتصال بـ SignalR
        const connection = await signalRService.connect(token);
        connectionRef.current = connection;

        if (!mounted) return;

        if (!connection) {
          const msg = "SignalR connection is null";
          setError(msg);
          console.error("❌ SignalR setup error:", msg);
          return;
        }

        // الاستماع للأحداث
        connection.off("ScreenMediaUpdated", handleScreenMediaUpdated);
        connection.off("ScreenMediaRefreshRequested", handleScreenMediaRefreshRequested);
        connection.on("ScreenMediaUpdated", handleScreenMediaUpdated);
        connection.on("ScreenMediaRefreshRequested", handleScreenMediaRefreshRequested);

        await tryJoinScreen("initial connect");

        setConnected(true);
        setError(null);
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : "SignalR connection failed";
          setError(errorMessage);
          console.error("❌ SignalR setup error:", errorMessage);
        }
      }
    }

    setupConnection();

    return () => {
      mounted = false;
      joinedRef.current = false;
      const connection = connectionRef.current;
      if (connection) {
        connection.off("ScreenMediaUpdated", handleScreenMediaUpdated);
        connection.off("ScreenMediaRefreshRequested", handleScreenMediaRefreshRequested);
      }
    };
  }, [screenId, onMediaUpdated, onRefreshRequested, tryJoinScreen]);

  useEffect(() => {
    const removeReconnecting = signalRService.addReconnectingListener(() => {
      joinedRef.current = false;
    });

    const removeReconnected = signalRService.addReconnectedListener(() => {
      joinedRef.current = false;
      void tryJoinScreen("reconnected");
    });

    return () => {
      removeReconnecting?.();
      removeReconnected?.();
    };
  }, [tryJoinScreen]);

  return { connected, error };
}
