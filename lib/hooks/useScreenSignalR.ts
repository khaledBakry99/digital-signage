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
  personCount?: number; // Number of people detected at time of detection
}

interface ScreenMediaRefreshEvent {
  screenId: number;
  campaignId?: number;
  reason: string;
  triggeredAtUtc: string;
}

/**
 * Hook to listen to SignalR events for screens
 *
 * @param screenId - Screen ID
 * @param onMediaUpdated - callback when media is updated
 * @param onRefreshRequested - callback when refresh is requested
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
        return;
      }

      if (connection.state !== HubConnectionState.Connected) {
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
        })
        .catch((err) => {
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
        onMediaUpdated(event);
      }
    };

    const handleScreenMediaRefreshRequested = (event: ScreenMediaRefreshEvent) => {
      if (event.screenId === screenId && onRefreshRequested) {
        onRefreshRequested(event);
      }
    };

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
        connectionRef.current = connection;

        if (!mounted) return;

        if (!connection) {
          const msg = "SignalR connection is null";
          setError(msg);
          return;
        }

        // Listen for events
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
