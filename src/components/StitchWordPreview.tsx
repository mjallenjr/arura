import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface StitchWordPreviewProps {
  word: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
}

function getTouchDistance(t1: Touch, t2: Touch) {
  return Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
}

function getTouchAngle(t1: Touch, t2: Touch) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
}

const StitchWordPreview = ({
  word,
  position,
  scale,
  rotation,
  onPositionChange,
  onScaleChange,
  onRotationChange,
}: StitchWordPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartAngleRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const pinchStartRotRef = useRef(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (e.touches.length === 2) {
        // Pinch start
        pinchStartDistRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        pinchStartAngleRef.current = getTouchAngle(e.touches[0], e.touches[1]);
        pinchStartScaleRef.current = scale;
        pinchStartRotRef.current = rotation;
        isDragging.current = false;
      } else if (e.touches.length === 1) {
        // Drag start
        isDragging.current = true;
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        posStartRef.current = { ...position };
      }
    },
    [scale, rotation, position]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const container = containerRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (e.touches.length === 2 && pinchStartDistRef.current !== null && pinchStartAngleRef.current !== null) {
        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        const angle = getTouchAngle(e.touches[0], e.touches[1]);
        onScaleChange(Math.min(3, Math.max(0.4, pinchStartScaleRef.current * (dist / pinchStartDistRef.current))));
        onRotationChange(pinchStartRotRef.current + (angle - pinchStartAngleRef.current));
        isDragging.current = false;
      } else if (e.touches.length === 1 && isDragging.current) {
        const dx = e.touches[0].clientX - dragStartRef.current.x;
        const dy = e.touches[0].clientY - dragStartRef.current.y;
        const newX = Math.max(5, Math.min(95, posStartRef.current.x + (dx / rect.width) * 100));
        const newY = Math.max(5, Math.min(95, posStartRef.current.y + (dy / rect.height) * 100));
        onPositionChange({ x: newX, y: newY });
      }
    },
    [onPositionChange, onScaleChange, onRotationChange]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    pinchStartDistRef.current = null;
    pinchStartAngleRef.current = null;
  }, []);

  // Mouse drag for desktop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isDragging.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      posStartRef.current = { ...position };

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const container = containerRef.current?.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const dx = ev.clientX - dragStartRef.current.x;
        const dy = ev.clientY - dragStartRef.current.y;
        const newX = Math.max(5, Math.min(95, posStartRef.current.x + (dx / rect.width) * 100));
        const newY = Math.max(5, Math.min(95, posStartRef.current.y + (dy / rect.height) * 100));
        onPositionChange({ x: newX, y: newY });
      };
      const onMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [position, onPositionChange]
  );

  if (!word) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-20 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        transition: isDragging.current ? "none" : "transform 0.1s ease-out",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-4xl font-bold tracking-tight text-foreground whitespace-nowrap"
        style={{
          textShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 2px 8px rgba(0,0,0,0.6)",
          fontStyle: "italic",
        }}
      >
        {word}
      </motion.p>
      {/* Drag handle ring */}
      <div className="absolute -inset-3 rounded-xl border border-dashed border-primary/30 pointer-events-none" />
    </div>
  );
};

export default StitchWordPreview;
