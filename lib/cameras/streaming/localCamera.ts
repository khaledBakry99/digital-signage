import { ERROR_MESSAGES } from "../constants";

/**
 * Local Camera Handler
 * Manages local webcam access using MediaDevices API
 * Supports sharing the same camera stream across multiple video elements
 */
class LocalCameraHandler {
  private activeStreams: Map<string, MediaStream> = new Map();
  private streamUsers: Map<string, Set<HTMLVideoElement>> = new Map(); // Track which elements use each stream

  /**
   * Request permission to access camera
   */
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Stop the stream immediately (we just wanted to check permission)
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
        } else if (error.name === "NotFoundError") {
          throw new Error(ERROR_MESSAGES.CAMERA_NOT_FOUND);
        } else if (error.name === "NotReadableError") {
          throw new Error(ERROR_MESSAGES.CAMERA_IN_USE);
        }
      }

      throw new Error("Failed to access camera");
    }
  }

  /**
   * Get list of available camera devices
   */
  async getDevices(): Promise<MediaDeviceInfo[]> {
    try {
      // Request permission first
      await this.requestPermission();

      // Get all devices
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Filter video input devices only
      const videoDevices = devices.filter((device) => device.kind === "videoinput");

      // Log for debugging
      console.log('📷 [CAMERA DEVICES]', videoDevices.map(d => ({
        deviceId: d.deviceId.slice(0, 8) + '...',
        label: d.label || '(empty)',
        hasLabel: !!d.label
      })));

      return videoDevices;
    } catch (error) {
      console.error('❌ [GET DEVICES ERROR]', error);
      throw error;
    }
  }

  /**
   * Start camera stream (or reuse existing stream for same device)
   */
  async startStream(
    deviceId: string,
    videoElement: HTMLVideoElement,
  ): Promise<MediaStream> {
    try {
      // Use empty string as key for default camera
      const cameraKey = deviceId || "default";

      // Check if we already have a stream for this device
      let stream = this.activeStreams.get(cameraKey);

      if (!stream || !stream.active) {
        // Create new stream
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            }
            : {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
          audio: false,
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          if (e instanceof DOMException && e.name === "OverconstrainedError") {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: deviceId
                  ? {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                  }
                  : {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                  },
                audio: false,
              });
            } catch (e2) {
              if (
                e2 instanceof DOMException &&
                e2.name === "OverconstrainedError"
              ) {
                try {
                  stream = await navigator.mediaDevices.getUserMedia({
                    video: deviceId ? { deviceId: { exact: deviceId } } : true,
                    audio: false,
                  });
                } catch (e3) {
                  if (deviceId) {
                    throw e3;
                  } else {
                    throw e3;
                  }
                }
              } else {
                throw e2;
              }
            }
          } else {
            throw e;
          }
        }
        this.activeStreams.set(cameraKey, stream);
        this.streamUsers.set(cameraKey, new Set());
      } else {
      }

      // Attach stream to video element
      videoElement.srcObject = stream;

      // Add this element to the users of this stream
      const users = this.streamUsers.get(cameraKey);
      if (users) {
        users.add(videoElement);
      }

      // Play the video
      try {
        await videoElement.play();
      } catch (playError) {
        // Ignore AbortError - it happens when switching between same camera
        if (
          playError instanceof DOMException &&
          playError.name !== "AbortError"
        ) {
          throw playError;
        }
      }

      return stream;
    } catch (error) {

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
        } else if (error.name === "NotFoundError") {
          throw new Error(ERROR_MESSAGES.CAMERA_NOT_FOUND);
        } else if (error.name === "NotReadableError") {
          throw new Error(
            "Camera is in use by another application. Please close other applications using the camera",
          );
        } else if (error.name === "OverconstrainedError") {
          throw new Error("Unable to start camera (Make sure camera is properly connected, or go to Edit Camera and select \"Webcam\" from the dropdown)");
        } else if (error.name === "AbortError") {
          // This is OK - just means play was interrupted
          const cameraKey = deviceId || "default";
          const existingStream = this.activeStreams.get(cameraKey);
          if (existingStream) {
            return existingStream;
          }
        }
      }

      throw new Error(
        "Failed to start camera stream. Please allow camera access in browser settings",
      );
    }
  }

  /**
   * Stop camera stream (only if no other elements are using it)
   */
  stopStream(stream: MediaStream): void {
    try {
      // Find which device this stream belongs to
      let cameraKey: string | null = null;
      this.activeStreams.forEach((activeStream, id) => {
        if (activeStream === stream) {
          cameraKey = id;
        }
      });

      if (!cameraKey) return;

      // Check if any other elements are using this stream
      const users = this.streamUsers.get(cameraKey);
      if (users && users.size > 0) {
        return;
      }

      // No more users, stop the stream
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      this.activeStreams.delete(cameraKey);
      this.streamUsers.delete(cameraKey);

    } catch (error) {
    }
  }

  /**
   * Remove a video element from stream users
   */
  removeUser(deviceId: string, videoElement: HTMLVideoElement): void {
    const cameraKey = deviceId || "default";
    const users = this.streamUsers.get(cameraKey);
    if (users) {
      users.delete(videoElement);

      // If no more users, stop the stream
      if (users.size === 0) {
        const stream = this.activeStreams.get(cameraKey);
        if (stream) {
          this.stopStream(stream);
        }
      }
    }
  }

  /**
   * Stop all active streams
   */
  stopAllStreams(): void {
    this.activeStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    this.activeStreams.clear();
    this.streamUsers.clear();
  }

  /**
   * Check if browser supports MediaDevices API
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

// Export singleton instance
export const localCameraHandler = new LocalCameraHandler();
