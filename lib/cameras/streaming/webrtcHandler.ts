import type { ReconnectConfig } from "@/lib/types/camera";

export type WebRTCConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

export interface WebRTCOptions {
  webrtcUrl: string;
  reconnectConfig?: ReconnectConfig;
  onStateChange?: (state: WebRTCConnectionState) => void;
  onError?: (error: Error) => void;
}

interface WebRTCConnection {
  peerConnection: RTCPeerConnection;
  videoElement: HTMLVideoElement;
  state: WebRTCConnectionState;
  reconnectAttempts: number;
  reconnectTimer?: ReturnType<typeof setTimeout>;
  options: WebRTCOptions;
  manuallyStopped: boolean;
}

class WebRTCHandler {
  private connections = new Map<string, WebRTCConnection>();

  private readonly DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
    maxAttempts: 3,
    delayMs: 5000,
    backoffMultiplier: 1.5,
  };

  async startStream(
    url: string,
    videoElement: HTMLVideoElement,
    options?: WebRTCOptions,
  ): Promise<void> {
    return this.startWebRTCStream(url, videoElement, options);
  }

  async startWebRTCStream(
    url: string,
    videoElement: HTMLVideoElement,
    options?: WebRTCOptions,
  ): Promise<void> {
    const resolvedOptions: WebRTCOptions = {
      webrtcUrl: url,
      ...options,
      reconnectConfig: {
        ...this.DEFAULT_RECONNECT_CONFIG,
        ...(options?.reconnectConfig ?? {}),
      },
    };

    console.log("[WebRTC] Starting stream");
    console.log("[WebRTC] WHEP URL:", resolvedOptions.webrtcUrl);

    if (!WebRTCHandler.isSupported()) {
      const error = new Error(
        "WebRTC is not supported by this browser.",
      );

      resolvedOptions.onError?.(error);
      throw error;
    }

    if (this.connections.has(url)) {
      this.stopStream(url);
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "stun:stun1.l.google.com:19302",
        },
      ],
    });

    const connection: WebRTCConnection = {
      peerConnection,
      videoElement,
      state: "connecting",
      reconnectAttempts: 0,
      options: resolvedOptions,
      manuallyStopped: false,
    };

    this.connections.set(url, connection);

    this.updateConnectionState(
      url,
      "connecting",
      resolvedOptions,
    );

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;

      console.log("[WebRTC] Connection state:", state);

      const mappedState =
        this.mapRTCStateToState(state);

      this.updateConnectionState(
        url,
        mappedState,
        resolvedOptions,
      );

      if (state === "connected") {
        const current = this.connections.get(url);

        if (current) {
          current.reconnectAttempts = 0;
        }

        console.log("[WebRTC] Connected successfully");
      }

      if (state === "failed") {
        this.handleConnectionFailure(
          url,
          resolvedOptions,
          resolvedOptions.reconnectConfig!,
        );
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      const state =
        peerConnection.iceConnectionState;

      console.log("[WebRTC] ICE state:", state);

      if (state === "failed") {
        this.handleConnectionFailure(
          url,
          resolvedOptions,
          resolvedOptions.reconnectConfig!,
        );
      }
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log(
        "[WebRTC] ICE gathering:",
        peerConnection.iceGatheringState,
      );
    };

    peerConnection.onsignalingstatechange = () => {
      console.log(
        "[WebRTC] Signaling state:",
        peerConnection.signalingState,
      );
    };

    peerConnection.ontrack = (event) => {
      console.log(
        "[WebRTC] Track received:",
        event.track.kind,
      );

      if (event.track.kind !== "video") {
        return;
      }

      let stream: MediaStream;

      if (event.streams.length > 0) {
        stream = event.streams[0];
      } else {
        stream = new MediaStream();
        stream.addTrack(event.track);
      }

      videoElement.srcObject = stream;

      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.playsInline = true;

      videoElement
        .play()
        .then(() => {
          console.log("[WebRTC] Video playback started");
        })
        .catch((error) => {
          console.error(
            "[WebRTC] Video play failed:",
            error,
          );

          const err =
            error instanceof Error
              ? error
              : new Error("Video playback failed");

          resolvedOptions.onError?.(err);
        });
    };

    console.log(
      "[WebRTC] Adding recvonly video transceiver",
    );

    peerConnection.addTransceiver("video", {
      direction: "recvonly",
    });

    console.log("[WebRTC] Creating SDP offer");

    const offer =
      await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    console.log(
      "[WebRTC] Local description set",
    );

    await this.waitForIceGathering(
      peerConnection,
      10000,
    );

    console.log(
      "[WebRTC] ICE gathering completed",
    );

    const localDescription =
      peerConnection.localDescription;

    if (!localDescription?.sdp) {
      throw new Error(
        "Local WebRTC SDP is empty.",
      );
    }

    console.log(
      "[WebRTC] Sending WHEP request:",
      resolvedOptions.webrtcUrl,
    );

    let response: Response;

    try {
      response = await fetch(
        resolvedOptions.webrtcUrl,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/sdp",
            Accept: "application/sdp",
          },

          body: localDescription.sdp,
        },
      );
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(
            "Could not connect to WHEP server.",
          );

      console.error(
        "[WebRTC] WHEP fetch failed:",
        err,
      );

      throw err;
    }

    console.log(
      "[WebRTC] WHEP response:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      let body = "";

      try {
        body = await response.text();
      } catch {
      }

      console.error(
        "[WebRTC] WHEP server error:",
        response.status,
        body,
      );

      throw new Error(
        `WHEP server returned ${response.status} ${response.statusText}${body ? `: ${body}` : ""
        }`,
      );
    }

    const answerSdp =
      await response.text();

    if (!answerSdp) {
      throw new Error(
        "WHEP server returned an empty SDP answer.",
      );
    }

    console.log(
      "[WebRTC] SDP answer received",
    );

    await peerConnection.setRemoteDescription({
      type: "answer",
      sdp: answerSdp,
    });

    console.log(
      "[WebRTC] Remote description set",
    );

    this.updateConnectionState(
      url,
      "connecting",
      resolvedOptions,
    );
  }

  private waitForIceGathering(
    peerConnection: RTCPeerConnection,
    timeoutMs: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      if (
        peerConnection.iceGatheringState ===
        "complete"
      ) {
        resolve();
        return;
      }

      let finished = false;

      const checkState = () => {
        if (
          peerConnection.iceGatheringState ===
          "complete"
        ) {
          finish();
        }
      };

      const finish = () => {
        if (finished) {
          return;
        }

        finished = true;

        peerConnection.removeEventListener(
          "icegatheringstatechange",
          checkState,
        );

        clearTimeout(timer);

        resolve();
      };

      peerConnection.addEventListener(
        "icegatheringstatechange",
        checkState,
      );

      const timer = setTimeout(() => {
        console.warn(
          "[WebRTC] ICE gathering timeout",
        );

        finish();
      }, timeoutMs);
    });
  }

  stopWebRTCStream(url: string): void {
    this.stopStream(url);
  }

  stopStream(url: string): void {
    const connection =
      this.connections.get(url);

    if (!connection) {
      return;
    }

    console.log(
      "[WebRTC] Stopping:",
      url,
    );

    connection.manuallyStopped = true;

    if (connection.reconnectTimer) {
      clearTimeout(
        connection.reconnectTimer,
      );

      connection.reconnectTimer = undefined;
    }

    const stream =
      connection.videoElement.srcObject;

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    connection.videoElement.srcObject = null;

    if (
      connection.peerConnection.signalingState !==
      "closed"
    ) {
      connection.peerConnection.close();
    }

    this.connections.delete(url);
  }

  stopAllStreams(): void {
    const urls = Array.from(
      this.connections.keys(),
    );

    urls.forEach((url) => {
      this.stopStream(url);
    });
  }

  getConnectionState(
    url: string,
  ): WebRTCConnectionState {
    return (
      this.connections.get(url)?.state ??
      "idle"
    );
  }

  async reconnect(
    url: string,
    videoElement: HTMLVideoElement,
    options?: WebRTCOptions,
  ): Promise<void> {
    const existing =
      this.connections.get(url);

    if (existing) {
      existing.manuallyStopped = true;

      if (existing.reconnectTimer) {
        clearTimeout(
          existing.reconnectTimer,
        );
      }

      const stream =
        existing.videoElement.srcObject;

      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      existing.videoElement.srcObject = null;

      existing.peerConnection.close();

      this.connections.delete(url);
    }

    await this.startWebRTCStream(
      url,
      videoElement,
      options ?? {
        webrtcUrl: url,
      },
    );
  }

  private handleConnectionFailure(
    url: string,
    options: WebRTCOptions,
    reconnectConfig: ReconnectConfig,
  ): void {
    const connection =
      this.connections.get(url);

    if (!connection) {
      return;
    }

    if (connection.manuallyStopped) {
      return;
    }

    if (connection.reconnectTimer) {
      return;
    }

    connection.reconnectAttempts++;

    console.warn(
      "[WebRTC] Reconnect attempt:",
      connection.reconnectAttempts,
      "/",
      reconnectConfig.maxAttempts,
    );

    if (
      connection.reconnectAttempts >
      reconnectConfig.maxAttempts
    ) {
      this.updateConnectionState(
        url,
        "failed",
        options,
      );

      options.onError?.(
        new Error(
          "Maximum WebRTC reconnection attempts reached.",
        ),
      );

      return;
    }

    const delay =
      reconnectConfig.delayMs *
      Math.pow(
        reconnectConfig.backoffMultiplier,
        connection.reconnectAttempts - 1,
      );

    console.log(
      `[WebRTC] Reconnecting in ${delay}ms`,
    );

    this.updateConnectionState(
      url,
      "connecting",
      options,
    );

    const videoElement =
      connection.videoElement;

    connection.reconnectTimer =
      setTimeout(async () => {
        const current =
          this.connections.get(url);

        if (!current) {
          return;
        }

        try {
          current.peerConnection.close();
        } catch {
        }

        this.connections.delete(url);

        try {
          await this.startWebRTCStream(
            url,
            videoElement,
            options,
          );
        } catch (error) {
          const err =
            error instanceof Error
              ? error
              : new Error(
                "WebRTC reconnect failed.",
              );

          console.error(
            "[WebRTC] Reconnect failed:",
            err,
          );

          options.onError?.(err);
        }
      }, delay);
  }

  private updateConnectionState(
    url: string,
    state: WebRTCConnectionState,
    options: WebRTCOptions,
  ): void {
    const connection =
      this.connections.get(url);

    if (connection) {
      connection.state = state;
    }

    console.log(
      `[WebRTC] State: ${state}`,
    );

    options.onStateChange?.(state);
  }

  private mapRTCStateToState(
    rtcState: RTCPeerConnectionState,
  ): WebRTCConnectionState {
    switch (rtcState) {
      case "new":
        return "connecting";

      case "connecting":
        return "connecting";

      case "connected":
        return "connected";

      case "disconnected":
        return "disconnected";

      case "failed":
        return "failed";

      case "closed":
        return "disconnected";

      default:
        return "idle";
    }
  }

  static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof RTCPeerConnection !==
      "undefined"
    );
  }
}

// Export singleton instance
export const webrtcHandler = new WebRTCHandler();
