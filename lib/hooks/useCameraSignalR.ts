import { useEffect, useRef, useState } from "react";
import { signalRService } from "../services/signalRService";

interface CameraDeactivatedEvent {
  cameraId: number;
  state: string;
  action: string;
  message: string;
  updatedAtUtc: string;
}

/**
 * Hook للاستماع لأحداث SignalR الخاصة بالكاميرات
 * 
 * @param cameraId - رقم الكاميرا
 * @param onDeactivated - callback عند إيقاف الكاميرا من السيرفر
 */
export function useCameraSignalR(
  cameraId: number,
  onDeactivated?: (event: CameraDeactivatedEvent) => void
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

        // الاستماع لحدث إيقاف الكاميرا
        connection.on("CameraDeactivated", (event: CameraDeactivatedEvent) => {
          if (event.cameraId === cameraId && onDeactivated) {
            console.log("📷❌ CameraDeactivated:", event);
            onDeactivated(event);
          }
        });

        // الانضمام لمجموعة الكاميرا
        if (!joinedRef.current) {
          await connection.invoke("JoinCamera", cameraId);
          joinedRef.current = true;
          console.log(`✅ Joined camera group: ${cameraId}`);
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
  }, [cameraId, onDeactivated]);

  return { connected, error };
}
