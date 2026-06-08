"use client";

import { useEffect, useRef, useState } from "react";
import type { Camera } from "@/lib/types/camera";
import { useCameraStream } from "@/lib/cameras/hooks/useCameraStream";

interface StreamPreviewProps {
  camera: Camera;
  className?: string;
}

export default function StreamPreview({
  camera,
  className = "",
}: StreamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const { startStream, stopStream, isConnecting, error } =
    useCameraStream(camera);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    const element = camera.type === "http" ? imgRef.current : videoRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [camera.type]);

  useEffect(() => {
    if (!isVisible) {
      stopStream();
      return;
    }

    const element = camera.type === "http" ? imgRef.current : videoRef.current;
    if (element) {
      startStream(element as HTMLVideoElement | HTMLImageElement);
    }

    return () => {
      stopStream();
    };
  }, [isVisible, camera, startStream, stopStream]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 text-gray-400 text-xs ${className}`}
      >
        <span>فشل التحميل</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 ${className}`}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gray-900 ${className}`}>
      {camera.type === "http" ? (
        <img
          ref={imgRef}
          alt={camera.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
