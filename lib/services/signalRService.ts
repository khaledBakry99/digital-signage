import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";
import { API_CONFIG } from "../api/config";

/**
 * SignalR Service - Manages real-time server connection
 * For getting live updates for screens and cameras
 */
export class SignalRService {
  private connection: HubConnection | null = null;
  private connecting = false;
  private connectPromise: Promise<HubConnection> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectingListeners = new Set<(error: Error | undefined) => void>();
  private reconnectedListeners = new Set<(connectionId: string | undefined) => void>();

  private buildConnection(token: string): HubConnection {
    const conn = new HubConnectionBuilder()
      .withUrl(`${API_CONFIG.BASE_URL}/hubs/screen-updates`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    conn.keepAliveIntervalInMilliseconds = 30000;
    conn.serverTimeoutInMilliseconds = 5 * 60 * 1000;

    conn.onreconnecting((error) => {
      this.reconnectAttempts++;
      this.reconnectingListeners.forEach((listener) => {
        try {
          listener(error ?? undefined);
        } catch (listenerError) {
        }
      });
    });

    conn.onreconnected((connectionId) => {
      this.reconnectAttempts = 0;
      this.reconnectedListeners.forEach((listener) => {
        try {
          listener(connectionId);
        } catch (listenerError) {
        }
      });
    });

    conn.onclose((error) => {
      this.connection = null;
    });

    return conn;
  }

  /**
   * Create SignalR connection
   */
  async connect(token: string): Promise<HubConnection> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (this.connection?.state === HubConnectionState.Connected) {
      return this.connection;
    }

    // Stop previous connection if exists
    if (this.connection) {
      if (this.connection.state !== HubConnectionState.Disconnected) {
        await this.connection.stop();
      }
    }

    this.connectPromise = (async () => {
      const maxAttempts = 2;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        this.connection = this.buildConnection(token);

        try {
          this.connecting = true;
          await this.connection.start();
          return this.connection;
        } catch (error) {
          lastError = error;
          try {
            await this.connection.stop();
          } catch {
            // ignore secondary stop errors
          }
          this.connection = null;

          // Delay before next retry
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          }
        } finally {
          this.connecting = false;
        }
      }

      throw lastError instanceof Error ? lastError : new Error(String(lastError || "SignalR connection failed"));
    })();

    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  /**
   * Get current connection
   */
  getConnection(): HubConnection | null {
    return this.connection;
  }

  /**
   * Is connected?
   */
  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  addReconnectingListener(listener: (error: Error | undefined) => void) {
    this.reconnectingListeners.add(listener);
    return () => this.reconnectingListeners.delete(listener);
  }

  addReconnectedListener(listener: (connectionId: string | undefined) => void) {
    this.reconnectedListeners.add(listener);
    return () => this.reconnectedListeners.delete(listener);
  }
}

// Singleton instance
export const signalRService = new SignalRService();
