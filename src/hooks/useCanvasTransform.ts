import { useState, useRef, useCallback, useEffect } from 'react';
import type { TransformState, Track } from '../types/game';

interface UseCanvasTransformOptions {
  referenceTrack: Track | null;
  targetTrack: Track | null;
  initialScale?: number;
  onScaleChange?: (scale: number) => void;
}

export interface StageTransform {
  x: number;
  y: number;
  zoom: number;
}

export function useCanvasTransform({
  referenceTrack,
  targetTrack: _targetTrack,
  initialScale = 1.0,
  onScaleChange,
}: UseCanvasTransformOptions) {
  const initialOffsetX = referenceTrack ? referenceTrack.boundingWidthMeters * 0.45 : 200;
  const initialOffsetY = referenceTrack ? referenceTrack.boundingHeightMeters * 0.1 : 50;

  // Target track interactive transform
  const [targetTransform, setTargetTransform] = useState<TransformState>(() => ({
    x: initialOffsetX,
    y: initialOffsetY,
    scale: initialScale,
    rotation: 0,
    opacity: 0.85,
  }));

  // Ghost transform (frozen guess state during reveal)
  const [ghostTransform, setGhostTransform] = useState<TransformState | null>(null);

  // Stage / Camera transform (world-to-screen mapping)
  const [stageTransform, setStageTransform] = useState<StageTransform>(() => {
    if (referenceTrack) {
      const maxDim = Math.max(
        referenceTrack.boundingWidthMeters,
        referenceTrack.boundingHeightMeters,
        1000
      );
      const calculatedZoom = Math.min(0.65, Math.max(0.12, 600 / (maxDim * 1.6)));
      return { x: 0, y: 0, zoom: calculatedZoom };
    }
    return { x: 0, y: 0, zoom: 0.35 };
  });

  // Animation state for smooth spring reveal
  const [isRevealing, setIsRevealing] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // Dragging interaction state
  const isDraggingTrackRef = useRef(false);
  const isPanningStageRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialTargetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialStagePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch pinch gesture tracking
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef<number>(initialScale);


  // Update scale with clamping
  const setScale = useCallback((newScale: number | ((prev: number) => number)) => {
    setTargetTransform((prev) => {
      const val = typeof newScale === 'function' ? newScale(prev.scale) : newScale;
      const clamped = Math.min(3.5, Math.max(0.15, Number(val.toFixed(4))));
      if (onScaleChange && clamped !== prev.scale) {
        onScaleChange(clamped);
      }
      return { ...prev, scale: clamped };
    });
  }, [onScaleChange]);

  // Fine-tuned nudge (e.g. ±0.005 or ±0.01)
  const nudgeScale = useCallback((delta: number) => {
    setScale((prev) => prev + delta);
  }, [setScale]);

  // Rotation steppers (+90° / -90°)
  const rotate90 = useCallback(() => {
    setTargetTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  const setRotation = useCallback((degrees: number) => {
    setTargetTransform((prev) => ({
      ...prev,
      rotation: (degrees % 360 + 360) % 360,
    }));
  }, []);

  // Opacity adjustment
  const setOpacity = useCallback((opacity: number) => {
    setTargetTransform((prev) => ({
      ...prev,
      opacity: Math.min(1.0, Math.max(0.2, opacity)),
    }));
  }, []);

  // Reset target position (center over reference track)
  const centerTargetTrack = useCallback(() => {
    setTargetTransform((prev) => ({
      ...prev,
      x: 0,
      y: 0,
    }));
  }, []);

  // --------------------------------------------------------------------------------
  // Reveal Spring Animation: transitions target scale to 1.0 (exact ground truth)
  // --------------------------------------------------------------------------------
  const triggerReveal = useCallback((onComplete?: () => void) => {
    if (isRevealing) return;

    // Freeze ghost outline at user's estimate
    setGhostTransform({ ...targetTransform });
    setIsRevealing(true);

    const startScale = targetTransform.scale;
    const targetScale = 1.0;
    const startX = targetTransform.x;
    const startY = targetTransform.y;

    // Bring target track closer to center if it was far away
    const endX = startX * 0.4;
    const endY = startY * 0.4;

    const startTime = performance.now();
    const duration = 1400; // ms spring animation

    // Critically damped spring simulation
    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / duration;

      if (elapsed < 1.0) {
        // High-order smooth elastic deceleration curve
        // f(t) = 1 - (1-t)^3 * cos(t * pi * 0.5)
        const t = elapsed;
        const progress = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 0.5);

        const currentScale = startScale + (targetScale - startScale) * progress;
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;

        setTargetTransform((prev) => ({
          ...prev,
          scale: currentScale,
          x: currentX,
          y: currentY,
        }));

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished: snap exactly to 1.0
        setTargetTransform((prev) => ({
          ...prev,
          scale: 1.0,
          x: endX,
          y: endY,
        }));
        animationFrameRef.current = null;
        if (onComplete) onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isRevealing, targetTransform]);

  // Pointer drag start on Target Track
  const handleTargetTrackPointerDown = useCallback((e: React.PointerEvent) => {
    if (isRevealing) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    isDraggingTrackRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialTargetPosRef.current = { x: targetTransform.x, y: targetTransform.y };
  }, [isRevealing, targetTransform.x, targetTransform.y]);

  // Pointer drag start on Background Stage (Camera Pan)
  const handleStagePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left click
    isPanningStageRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialStagePosRef.current = { x: stageTransform.x, y: stageTransform.y };
  }, [stageTransform.x, stageTransform.y]);

  // Pointer move handler
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDraggingTrackRef.current) {
      // Invert stage zoom to convert screen pixels to world meters
      const dx = (e.clientX - dragStartRef.current.x) / stageTransform.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / stageTransform.zoom;

      setTargetTransform((prev) => ({
        ...prev,
        x: initialTargetPosRef.current.x + dx,
        y: initialTargetPosRef.current.y + dy,
      }));
    } else if (isPanningStageRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      setStageTransform((prev) => ({
        ...prev,
        x: initialStagePosRef.current.x + dx,
        y: initialStagePosRef.current.y + dy,
      }));
    }
  }, [stageTransform.zoom]);

  // Pointer up handler
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingTrackRef.current = false;
    isPanningStageRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  // Wheel zoom handler:
  // - Holding Shift/Alt or scrolling directly over track adjusts track scale
  // - Default wheel zooms stage camera in/out
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (e.shiftKey || e.altKey) {
      // Adjust target track scale
      const delta = -e.deltaY * 0.002;
      setScale((prev) => prev * (1 + delta));
    } else {
      // Zoom stage camera centered at cursor
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      setStageTransform((prev) => {
        const nextZoom = Math.min(1.5, Math.max(0.08, prev.zoom * zoomFactor));
        return {
          ...prev,
          zoom: nextZoom,
        };
      });
    }
  }, [setScale]);

  // Touch handlers for mobile pinch gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom target scale
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialTouchDistanceRef.current = dist;
      initialPinchScaleRef.current = targetTransform.scale;
    }
  }, [targetTransform.scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / initialTouchDistanceRef.current;
      setScale(initialPinchScaleRef.current * ratio);
    }
  }, [setScale]);

  const handleTouchEnd = useCallback(() => {
    initialTouchDistanceRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    targetTransform,
    ghostTransform,
    stageTransform,
    isRevealing,
    setScale,
    nudgeScale,
    rotate90,
    setRotation,
    setOpacity,
    centerTargetTrack,
    triggerReveal,
    handlers: {
      onTargetPointerDown: handleTargetTrackPointerDown,
      onStagePointerDown: handleStagePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
