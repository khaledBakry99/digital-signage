import type { ReconnectConfig } from "@/lib/types/camera";

/**
 * WebRTC Connection State
 */
export type WebRTCConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

/**
 * WebRTC Handler Options
 */
export interface WebRTCOptions {
  webrtcUrl: string; // WHEP endpoint URL
  reconnectConfig?: ReconnectConfig;
  onStateChange?: (state: WebRTCConnectionState) => void;
  onError?: (error: Error) => void;
}

/**
 * WebRTC/WHEP Handler
 * Manages WebRTC connections for RTSP camera playback
 * Uses WHEP (WebRTC HTTP Egress Protocol) for server-to-client streaming
 */
class WebRTCHandler {
  private connections: Map<string, {
    peerConnection: RTCPeerConnection;
    videoElement: HTMLVideoElement;
    state: WebRTCConnectionState;
    reconnectAttempts: number;
    reconnectTimer?: NodeJS.Timeout;
    options: WebRTCOptions;
  }> = new Map();

  private readonly DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
    maxAttempts: 3,
    delayMs: 5000,
    backoffMultiplier: 1.5,
  };

  /**
   * Start WebRTC stream using WHEP protocol
   */
  async startStream(
    url: string,
    videoElement: HTMLVideoElement,
    options: WebRTCOptions,
  ): Promise<void> {
    return this.startWebRTCStream(url, videoElement, options);
  }

  /**
   * Start WebRTC stream (alias for useCameraStream)
   */
  async startWebRTCStream(
    url: string,
    videoElement: HTMLVideoElement,
    options?: WebRTCOptions,
  ): Promise<void> {
    // Resolve options with defaults
    const resolvedOptions: WebRTCOptions = options || {
      webrtcUrl: url,
      reconnectConfig: this.DEFAULT_RECONNECT_CONFIG,
    };

    try {
      // Check if already connected
      const existing = this.connections.get(url);
      if (existing) {
        this.stopStream(url);
      }

      const reconnectConfig = {
        ...this.DEFAULT_RECONNECT_CONFIG,
        ...resolvedOptions.reconnectConfig,
      };

      // Create RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Track connection state
      peerConnection.onconnectionstatechange = () => {
        const state = this.mapRTCStateToState(peerConnection.connectionState);
        this.updateConnectionState(url, state, resolvedOptions);
      };

      peerConnection.oniceconnectionstatechange = () => {
        if (peerConnection.iceConnectionState === "failed") {
          this.handleConnectionFailure(url, resolvedOptions, reconnectConfig);
        }
      };

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        if (event.track.kind === "video") {
          videoElement.srcObject = event.streams[0];
          videoElement.play().catch((err) => {
            resolvedOptions.onError?.(new Error(`Video play failed: ${err.message}`));
          });
        }
      };

      // Create offer for WHEP
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve) => {
        if (peerConnection.iceGatheringState === "complete") {
          resolve();
          return;
        }

        const checkState = () => {
          if (peerConnection.iceGatheringState === "complete") {
            peerConnection.removeEventListener("icegatheringstatechange", checkState);
            resolve();
          }
        };

        peerConnection.addEventListener("icegatheringstatechange", checkState);

        // Timeout after 10 seconds
        setTimeout(() => {
          peerConnection.removeEventListener("icegatheringstatechange", checkState);
          resolve();
        }, 10000);
      });

      // Send offer to WHEP endpoint
      console.log('[WebRTC] WHEP URL:', resolvedOptions.webrtcUrl);
      console.log('[WebRTC] Sending SDP offer to WHEP endpoint...');
      const response = await fetch(resolvedOptions.webrtcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: peerConnection.localDescription?.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHEP server returned ${response.status}`);
      }

      const answerSdp = await response.text();

      // Set remote description (answer from server)
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: answerSdp,
        }),
      );

      // Store connection
      this.connections.set(url, {
        peerConnection,
        videoElement,
        state: "connecting",
        reconnectAttempts: 0,
        options: resolvedOptions,
      });

      this.updateConnectionState(url, "connecting", resolvedOptions);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("WebRTC connection failed");
      resolvedOptions.onError?.(err);
      this.updateConnectionState(url, "failed", resolvedOptions);
      throw err;
    }
  }

  /**
   * Stop WebRTC stream (alias for useCameraStream)
   */
  stopWebRTCStream(url: string): void {
    this.stopStream(url);
  }

  /**
   * Stop WebRTC stream
   */
  stopStream(url: string): void {
    const connection = this.connections.get(url);
    if (!connection) return;

    // Clear reconnect timer
    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
    }

    // Close peer connection
    connection.peerConnection.close();
    connection.videoElement.srcObject = null;

    // Remove from map
    this.connections.delete(url);
  }

  /**
   * Stop all WebRTC streams
   */
  stopAllStreams(): void {
    this.connections.forEach((_, url) => {
      this.stopStream(url);
    });
  }

  /**
   * Get connection state for a URL
   */
  getConnectionState(url: string): WebRTCConnectionState {
    return this.connections.get(url)?.state || "idle";
  }

  /**
   * Reconnect to a WebRTC stream
   */
  async reconnect(
    url: string,
    videoElement: HTMLVideoElement,
    options: WebRTCOptions,
  ): Promise<void> {
    this.stopStream(url);
    await this.startStream(url, videoElement, options);
  }

  /**
   * Handle connection failure with reconnection logic
   */
  private handleConnectionFailure(
    url: string,
    options: WebRTCOptions,
    reconnectConfig: ReconnectConfig,
  ): void {
    const connection = this.connections.get(url);
    if (!connection) return;

    connection.reconnectAttempts++;

    if (connection.reconnectAttempts > reconnectConfig.maxAttempts) {
      this.updateConnectionState(url, "failed", options);
      options.onError?.(new Error("Max reconnection attemptsReached"));
      return;
    }

    // Calculate delay with exponential backoff
    const delay = reconnectConfig.delayMs * Math.pow(
      reconnectConfig.backoffMultiplier,
      connection.reconnectAttempts - 1,
    );

    this.updateConnectionState(url, "connecting", options);

    // Schedule reconnection
    connection.reconnectTimer = setTimeout(() => {
      this.reconnect(url, connection.videoElement, options).catch((err) => {
        options.onError?.(err);
      });
    }, delay);
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(
    url: string,
    state: WebRTCConnectionState,
    options: WebRTCOptions,
  ): void {
    const connection = this.connections.get(url);
    if (connection) {
      connection.state = state;
    }
    options.onStateChange?.(state);
  }

  /**
   * Map RTC connection state to our state
   */
  private mapRTCStateToState(
    rtcState: RTCPeerConnectionState,
  ): WebRTCConnectionState {
    switch (rtcState) {
      case "connected":
        return "connected";
      case "connecting":
        return "connecting";
      case "disconnected":
      case "closed":
        return "disconnected";
      case "failed":
        return "failed";
      default:
        return "idle";
    }
  }

  /**
   * Check if WebRTC is supported
   */
  static isSupported(): boolean {
    return typeof RTCPeerConnection !== "undefined";
  }
}

// Export singleton instance
export const webrtcHandler = new WebRTCHandler();
