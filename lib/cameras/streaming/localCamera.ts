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

      throw new Error("فشل الوصول للكاميرا");
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
      return devices.filter((device) => device.kind === "videoinput");
    } catch (error) {
      console.error("Failed to get devices:", error);
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
            console.warn(
              "OverconstrainedError: retrying with 1280x720 constraints...",
            );
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
                console.warn(
                  "OverconstrainedError: retrying with deviceId only or basic constraints...",
                );
                try {
                  stream = await navigator.mediaDevices.getUserMedia({
                    video: deviceId ? { deviceId: { exact: deviceId } } : true,
                    audio: false,
                  });
                } catch (e3) {
                  if (deviceId) {
                    console.warn(
                      "Failed to start requested deviceId; refusing to auto-select a different camera",
                      { deviceId },
                    );
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
        console.log(`Created new stream for device: ${cameraKey}`);
      } else {
        console.log(`Reusing existing stream for device: ${cameraKey}`);
      }

      // Attach stream to video element
      videoElement.srcObject = stream;

      // Add this element to the users of this stream
      const users = this.streamUsers.get(cameraKey);
      if (users) {
        users.add(videoElement);
        console.log(`Device ${cameraKey} now has ${users.size} users`);
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
      console.error("Local camera error details:", error);

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
        } else if (error.name === "NotFoundError") {
          throw new Error(ERROR_MESSAGES.CAMERA_NOT_FOUND);
        } else if (error.name === "NotReadableError") {
          throw new Error(
            "الكاميرا مستخدمة من قبل تطبيق آخر. الرجاء إغلاق التطبيقات الأخرى التي تستخدم الكاميرا",
          );
        } else if (error.name === "OverconstrainedError") {
          throw new Error("إعدادات الكاميرا غير مدعومة. جرب كاميرا أخرى");
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
        "فشل بدء البث من الكاميرا. الرجاء السماح بالوصول للكاميرا من إعدادات المتصفح",
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
        console.log(
          `Stream for ${cameraKey} still has ${users.size} users, not stopping`,
        );
        return;
      }

      // No more users, stop the stream
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      this.activeStreams.delete(cameraKey);
      this.streamUsers.delete(cameraKey);

      console.log(`Stopped stream for ${cameraKey}`);
    } catch (error) {
      console.error("Failed to stop stream:", error);
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
      console.log(
        `Removed user from device ${cameraKey}, remaining users: ${users.size}`,
      );

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
