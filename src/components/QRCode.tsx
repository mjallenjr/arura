import { useEffect, useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
}

// Simple QR-like visual using a canvas pattern (for display purposes)
// In production, use a proper QR library
const QRCode = ({ value, size = 200 }: QRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = 6;
    const grid = Math.floor(size / cellSize);
    canvas.width = size;
    canvas.height = size;

    // Generate deterministic pattern from value
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }

    ctx.fillStyle = "hsl(220, 20%, 6%)";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "hsl(190, 90%, 60%)";

    // Draw finder patterns (corners)
    const drawFinder = (x: number, y: number) => {
      for (let dy = 0; dy < 7; dy++) {
        for (let dx = 0; dx < 7; dx++) {
          const isBorder = dx === 0 || dx === 6 || dy === 0 || dy === 6;
          const isInner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
          if (isBorder || isInner) {
            ctx.fillRect((x + dx) * cellSize, (y + dy) * cellSize, cellSize, cellSize);
          }
        }
      }
    };

    drawFinder(1, 1);
    drawFinder(grid - 9, 1);
    drawFinder(1, grid - 9);

    // Fill data area with seeded random pattern
    const seed = Math.abs(hash);
    let rng = seed;
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        // Skip finder pattern areas
        if ((x < 9 && y < 9) || (x > grid - 10 && y < 9) || (x < 9 && y > grid - 10)) continue;

        rng = ((rng * 16807) % 2147483647);
        if (rng % 3 === 0) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value, size]);

  return (
    <div className="signal-surface rounded-2xl p-6">
      <canvas ref={canvasRef} className="rounded-lg" style={{ width: size, height: size }} />
    </div>
  );
};

export default QRCode;
