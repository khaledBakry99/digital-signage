"use client";

import { useState, useRef, useEffect } from "react";
import type { Camera } from "@/lib/types/camera";
import { CameraPlayer } from "./CameraPlayer";
import { useTheme } from "@/lib/context/ThemeContext";

interface FloatingCameraPlayerProps {
  camera: Camera;
  onClose: () => void;
  index?: number;
}

export function FloatingCameraPlayer({ camera, onClose, index = 0 }: FloatingCameraPlayerProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";

  // Offset position based on index to prevent overlap
  const offset = index * 30;
  const [position, setPosition] = useState({ x: 20 + offset, y: 20 + offset });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const dragRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }

    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;

      // Constrain to window bounds
      const maxX = window.innerWidth - 480;
      const maxY = window.innerHeight - (isMinimized ? 60 : 360);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMinimized]);

  return (
    <div
      ref={dragRef}
      className="fixed z-50 shadow-2xl rounded-2xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? '280px' : '450px',
        height: isMinimized ? '50px' : '320px',
        background: isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        border: isLightTheme ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header / Drag Handle */}
      <div
        className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-3 z-10"
        style={{
          background: isLightTheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.8)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-medium truncate max-w-[120px]">
            {camera.name}
          </span>
          <span className="text-red-400 text-xs font-medium whitespace-nowrap">
            (يجب ابقاء هذه الصفحة مفتوحة لعمل الذكاء الاصطناعي)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-red-500/80 transition-colors"
            title="إغلاق"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera Content */}
      {!isMinimized && (
        <div className="absolute inset-0 top-10">
          <CameraPlayer camera={camera} autoStart={true} />
        </div>
      )}
    </div>
  );
}
