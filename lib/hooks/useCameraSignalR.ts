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
 * Hook to listen to SignalR events for cameras
 * 
 * @param cameraId - Camera ID
 * @param onDeactivated - callback when camera is deactivated from server
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
        // Get token from localStorage
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found");
          return;
        }

        // Connect to SignalR
        const connection = await signalRService.connect(token);

        if (!mounted) return;

        // Listen for camera deactivation event
        connection.on("CameraDeactivated", (event: CameraDeactivatedEvent) => {
          if (event.cameraId === cameraId && onDeactivated) {
            onDeactivated(event);
          }
        });

        // Join camera group
        if (!joinedRef.current) {
          await connection.invoke("JoinCamera", cameraId);
          joinedRef.current = true;
        }

        setConnected(true);
        setError(null);
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : "SignalR connection failed";
          setError(errorMessage);
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
