import React, { useEffect, useRef } from "react";

interface Node {
  x: number; // 0 to 1 relative
  y: number; // 0 to 1 relative
  neighbors: number[];
}

interface Packet {
  currentX: number;
  currentY: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number;
  color: string;
}

export default function NetworkWorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let resizeObserver: ResizeObserver;

    // Define geographical node coordinates approximating a world map
    const baseNodes: Node[] = [
      // North America (0-5)
      { x: 0.15, y: 0.32, neighbors: [1, 2, 3] },
      { x: 0.22, y: 0.24, neighbors: [0, 2, 4] },
      { x: 0.26, y: 0.34, neighbors: [0, 1, 3, 4, 8] },
      { x: 0.18, y: 0.44, neighbors: [0, 2, 5] },
      { x: 0.28, y: 0.28, neighbors: [1, 2, 8] },
      { x: 0.30, y: 0.52, neighbors: [3, 6, 7] }, // Central America bridge

      // South America (6-9)
      { x: 0.34, y: 0.65, neighbors: [5, 7, 8] },
      { x: 0.36, y: 0.78, neighbors: [6, 9] },
      { x: 0.42, y: 0.60, neighbors: [6, 9, 13, 14] }, // Transatlantic EU/AF link
      { x: 0.39, y: 0.86, neighbors: [7, 8] },

      // Europe (10-14)
      { x: 0.48, y: 0.28, neighbors: [11, 12, 13] },
      { x: 0.54, y: 0.24, neighbors: [10, 12, 18] },
      { x: 0.56, y: 0.33, neighbors: [10, 11, 13, 14, 18] },
      { x: 0.50, y: 0.36, neighbors: [8, 10, 12, 14, 15] },
      { x: 0.47, y: 0.42, neighbors: [8, 12, 13, 15] },

      // Africa (15-18)
      { x: 0.52, y: 0.55, neighbors: [13, 14, 16, 17] },
      { x: 0.56, y: 0.68, neighbors: [15, 17] },
      { x: 0.61, y: 0.76, neighbors: [15, 16, 25] }, // Link to Asia/Oceania
      { x: 0.60, y: 0.48, neighbors: [11, 12, 15, 19] },

      // Asia (19-27)
      { x: 0.68, y: 0.30, neighbors: [18, 20, 21] },
      { x: 0.74, y: 0.25, neighbors: [19, 21, 22] },
      { x: 0.78, y: 0.34, neighbors: [19, 20, 22, 23, 24] },
      { x: 0.84, y: 0.28, neighbors: [20, 21, 24] },
      { x: 0.76, y: 0.46, neighbors: [21, 24, 25, 26] },
      { x: 0.72, y: 0.41, neighbors: [21, 22, 23, 25] },
      { x: 0.86, y: 0.44, neighbors: [17, 21, 23, 26, 28] }, // Pacific bridge to US/Oceania
      { x: 0.66, y: 0.48, neighbors: [23, 24] },
      { x: 0.81, y: 0.52, neighbors: [23, 25, 28] },

      // Oceania (28-30)
      { x: 0.83, y: 0.74, neighbors: [25, 27, 29, 30] },
      { x: 0.89, y: 0.82, neighbors: [28, 30] },
      { x: 0.87, y: 0.70, neighbors: [28, 29] }
    ];

    // Ensure bidirectional relationships
    baseNodes.forEach((node, idx) => {
      node.neighbors.forEach(nIdx => {
        if (!baseNodes[nIdx].neighbors.includes(idx)) {
          baseNodes[nIdx].neighbors.push(idx);
        }
      });
    });

    const packets: Packet[] = [];
    const maxPackets = 16;

    // Helper to spawn a random active packet
    const spawnPacket = (fromIdx?: number): Packet => {
      const startIdx = fromIdx !== undefined ? fromIdx : Math.floor(Math.random() * baseNodes.length);
      const node = baseNodes[startIdx];
      const nextIdx = node.neighbors[Math.floor(Math.random() * node.neighbors.length)];
      const targetNode = baseNodes[nextIdx];

      return {
        currentX: node.x,
        currentY: node.y,
        startX: node.x,
        startY: node.y,
        endX: targetNode.x,
        endY: targetNode.y,
        progress: 0,
        speed: 0.003 + Math.random() * 0.006,
        color: Math.random() > 0.35 ? "#00AEEF" : "#00e1ff" // Cyber cyan and neon light cyan
      };
    };

    // Initialize packet pool
    for (let i = 0; i < maxPackets; i++) {
      packets.push(spawnPacket());
    }

    // Handle canvas dimensions with high-DPI scaling
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    // Use ResizeObserver for perfect non-flickering responsive scale
    resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(canvas);
    updateSize();

    let pulseTime = 0;

    const render = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // Cyberpunk black translucent background for trail motion effects
      ctx.fillStyle = "rgba(4, 7, 14, 0.2)";
      ctx.fillRect(0, 0, w, h);

      // 1. Draw subtle background coordinate grid lines
      ctx.strokeStyle = "rgba(0, 174, 239, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 45;
      
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Pulse multiplier for glowing node rings
      pulseTime += 0.04;
      const nodePulseSize = Math.sin(pulseTime) * 3 + 6;
      const glowOpacity = Math.sin(pulseTime) * 0.15 + 0.25;

      // 2. Draw static network path lines between nodes
      ctx.lineWidth = 1.2;
      baseNodes.forEach((node) => {
        node.neighbors.forEach((neighborIdx) => {
          if (neighborIdx > baseNodes.indexOf(node)) {
            // Draw gradient lines to simulate high-tech data paths
            const neighbor = baseNodes[neighborIdx];
            const x1 = node.x * w;
            const y1 = node.y * h;
            const x2 = neighbor.x * w;
            const y2 = neighbor.y * h;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = "rgba(0, 174, 239, 0.06)";
            ctx.stroke();
          }
        });
      });

      // 3. Draw global nodes
      baseNodes.forEach((node) => {
        const nx = node.x * w;
        const ny = node.y * h;

        // Base network dot
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 174, 239, 0.7)";
        ctx.fill();

        // Pulsing radar glow on occasional critical nodes (every 3rd node)
        if (baseNodes.indexOf(node) % 3 === 0) {
          ctx.beginPath();
          ctx.arc(nx, ny, nodePulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 225, 255, ${glowOpacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // 4. Update & draw flowing active packets (data traffic streams)
      packets.forEach((packet, idx) => {
        packet.progress += packet.speed;

        // Reset and chain to a random neighbor when complete
        if (packet.progress >= 1) {
          const matchingNodeIdx = baseNodes.findIndex(
            (n) => Math.abs(n.x - packet.endX) < 0.01 && Math.abs(n.y - packet.endY) < 0.01
          );
          packets[idx] = spawnPacket(matchingNodeIdx !== -1 ? matchingNodeIdx : undefined);
          return;
        }

        // Interpolate position
        const px = (packet.startX + (packet.endX - packet.startX) * packet.progress) * w;
        const py = (packet.startY + (packet.endY - packet.startY) * packet.progress) * h;

        packet.currentX = px;
        packet.currentY = py;

        // Draw particle glow
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.shadowColor = packet.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = packet.color;
        ctx.fill();

        // Reset shadow to avoid slowing down rendering
        ctx.shadowBlur = 0;

        // Draw a tiny trail
        const trailProgress = Math.max(0, packet.progress - 0.08);
        const tx = (packet.startX + (packet.endX - packet.startX) * trailProgress) * w;
        const ty = (packet.startY + (packet.endY - packet.startY) * trailProgress) * h;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = `rgba(0, 225, 255, ${0.4 * (1 - packet.progress)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.38]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
