import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    let mounted = true;

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
        
        if (!mounted) return;

        if (!connection) {
          const msg = "SignalR connection is null";
          setError(msg);
          console.error("❌ SignalR setup error:", msg);
          return;
        }

        // الاستماع للأحداث
        connection.on("ScreenMediaUpdated", (event: ScreenMediaUpdatedEvent) => {
          if (event.screenId === screenId && onMediaUpdated) {
            console.log("📺 ScreenMediaUpdated:", event);
            onMediaUpdated(event);
          }
        });

        connection.on("ScreenMediaRefreshRequested", (event: ScreenMediaRefreshEvent) => {
          if (event.screenId === screenId && onRefreshRequested) {
            console.log("🔄 ScreenMediaRefreshRequested:", event);
            onRefreshRequested(event);
          }
        });

        // الانضمام لمجموعة الشاشة
        if (!joinedRef.current) {
          await connection.invoke("JoinScreen", screenId);
          joinedRef.current = true;
          console.log(`✅ Joined screen group: ${screenId}`);
        }

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
    };
  }, [screenId, onMediaUpdated, onRefreshRequested]);

  return { connected, error };
}
