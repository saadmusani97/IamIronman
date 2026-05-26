"use client";

import { useEffect, useRef } from "react";

interface RippleGridProps {
  gridColor?: string;
  rippleIntensity?: number;
  gridSize?: number;
  gridThickness?: number;
  fadeDistance?: number;
  vignetteStrength?: number;
  glowIntensity?: number;
  opacity?: number;
  gridRotation?: number;
  className?: string;
}

export function RippleGrid({
  gridColor = "#9d2828",
  rippleIntensity = 0.07,
  gridSize = 10,
  gridThickness = 16,
  fadeDistance = 4.1,
  vignetteStrength = 2,
  glowIntensity = 1,
  opacity = 1,
  gridRotation = 0,
  className = "",
}: RippleGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (timestamp: number) => {
      timeRef.current = timestamp * 0.001;
      const t = timeRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Parse grid color
      const hex = gridColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      const cellSize = Math.min(w, h) / gridSize;
      const lineWidth = Math.max(0.5, cellSize / gridThickness);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((gridRotation * Math.PI) / 180);
      ctx.translate(-w / 2, -h / 2);

      const cols = Math.ceil(w / cellSize) + 2;
      const rows = Math.ceil(h / cellSize) + 2;
      const offsetX = (w % cellSize) / 2;
      const offsetY = (h % cellSize) / 2;

      // Draw vertical lines
      for (let i = -1; i <= cols; i++) {
        const x = offsetX + i * cellSize;
        const cx = x / w - 0.5;

        for (let j = -1; j <= rows; j++) {
          const y1 = offsetY + j * cellSize;
          const y2 = y1 + cellSize;
          const cy = (y1 + cellSize / 2) / h - 0.5;

          const dist = Math.sqrt(cx * cx + cy * cy);
          const ripple = Math.sin(dist * fadeDistance * Math.PI - t * 2) * rippleIntensity;
          const fade = Math.max(0, 1 - dist * vignetteStrength);
          const alpha = Math.max(0, Math.min(1, (fade + ripple) * glowIntensity)) * opacity;

          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      }

      // Draw horizontal lines
      for (let j = -1; j <= rows; j++) {
        const y = offsetY + j * cellSize;
        const cy = y / h - 0.5;

        for (let i = -1; i <= cols; i++) {
          const x1 = offsetX + i * cellSize;
          const x2 = x1 + cellSize;
          const cx = (x1 + cellSize / 2) / w - 0.5;

          const dist = Math.sqrt(cx * cx + cy * cy);
          const ripple = Math.sin(dist * fadeDistance * Math.PI - t * 2) * rippleIntensity;
          const fade = Math.max(0, 1 - dist * vignetteStrength);
          const alpha = Math.max(0, Math.min(1, (fade + ripple) * glowIntensity)) * opacity;

          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      }

      ctx.restore();
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [gridColor, rippleIntensity, gridSize, gridThickness, fadeDistance, vignetteStrength, glowIntensity, opacity, gridRotation]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ pointerEvents: "none" }}
    />
  );
}
