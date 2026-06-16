import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";
import { API_CONFIG } from "../api/config";

/**
 * SignalR Service - إدارة الاتصال الفوري بالسيرفر
 * للحصول على تحديثات مباشرة للشاشات والكاميرات
 */
export class SignalRService {
  private connection: HubConnection | null = null;
  private connecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private buildConnection(token: string): HubConnection {
    const conn = new HubConnectionBuilder()
      .withUrl(`${API_CONFIG.BASE_URL}/hubs/screen-updates`, {
        accessTokenFactory: () => token,
        // WebSockets preferred, LongPolling as fallback for restricted envs
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    conn.keepAliveIntervalInMilliseconds = 15000;
    conn.serverTimeoutInMilliseconds = 60000;

    conn.onreconnecting((error) => {
      console.log("🔄 SignalR reconnecting...", error?.message);
      this.reconnectAttempts++;
    });

    conn.onreconnected((connectionId) => {
      console.log("✅ SignalR reconnected:", connectionId);
      this.reconnectAttempts = 0;
    });

    conn.onclose((error) => {
      console.log("❌ SignalR connection closed:", error?.message);
      this.connection = null;
    });

    return conn;
  }

  /**
   * إنشاء اتصال SignalR
   */
  async connect(token: string): Promise<HubConnection> {
    if (this.connecting && this.connection) {
      return this.connection;
    }

    if (this.connection?.state === HubConnectionState.Connected) {
      return this.connection;
    }

    // إيقاف الاتصال السابق إن وجد
    if (this.connection) {
      if (this.connection.state !== HubConnectionState.Disconnected) {
        await this.connection.stop();
      }
    }

    const maxAttempts = 2;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.connection = this.buildConnection(token);

      try {
        this.connecting = true;
        await this.connection.start();
        console.log("🚀 SignalR connected successfully");
        return this.connection;
      } catch (error) {
        lastError = error;
        console.error(`❌ Failed to connect SignalR (attempt ${attempt}/${maxAttempts}):`, error);
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
  }

  /**
   * قطع الاتصال
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  /**
   * الحصول على الاتصال الحالي
   */
  getConnection(): HubConnection | null {
    return this.connection;
  }

  /**
   * هل متصل؟
   */
  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

// Singleton instance
export const signalRService = new SignalRService();
