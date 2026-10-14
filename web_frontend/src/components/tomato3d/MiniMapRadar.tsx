import React, { useEffect, useRef } from 'react';
import { Navigation, Maximize2, Minimize2 } from 'lucide-react';
import type { WorldEngine } from '../../3d/engine/WorldEngine';

export interface MiniMapRadarProps {
  showMiniMap: boolean;
  miniMapExpanded: boolean;
  setMiniMapExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileLandscape: boolean;
  remainingCollectibles: number;
  engineRef: React.RefObject<WorldEngine | null>;
  playerCoordsRef: React.MutableRefObject<{ x: number; z: number; heading: number }>;
}

export const MiniMapRadar: React.FC<MiniMapRadarProps> = ({
  showMiniMap,
  miniMapExpanded,
  setMiniMapExpanded,
  isMobileLandscape,
  remainingCollectibles,
  engineRef,
  playerCoordsRef,
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!showMiniMap) return;
    let animId: number;
    let lastTime = 0;
    const interval = 1000 / 30; // 30 FPS cap for mobile efficiency

    const renderRadar = (timestamp: number = 0) => {
      animId = requestAnimationFrame(renderRadar);
      if (timestamp - lastTime < interval) return;
      lastTime = timestamp;

      const canvas = radarCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const worldRadius = 122.0; // Updated for 260m world expansion
      const pad = 10;
      const scale = (cx - pad) / worldRadius;

      // 1. Clear & Background Radial Gradient
      ctx.clearRect(0, 0, w, h);

      // Radar Screen Circular Clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
      ctx.clip();

      const bgGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, cx);
      bgGrad.addColorStop(0, '#0f2438');
      bgGrad.addColorStop(0.7, '#081424');
      bgGrad.addColorStop(1, '#040913');
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // 2. Concentric Radar Distance Rings (updated for 122m world radius)
      const rings = [40, 80, 115];
      ctx.lineWidth = 1;
      rings.forEach((rDist, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, rDist * scale, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 2 ? 'rgba(52, 211, 153, 0.4)' : 'rgba(52, 211, 153, 0.16)';
        ctx.setLineDash(idx === 2 ? [] : [3, 4]);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 3. Crosshairs & Cardinal Labels
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.beginPath();
      ctx.moveTo(cx, pad);
      ctx.lineTo(cx, h - pad);
      ctx.moveTo(pad, cy);
      ctx.lineTo(w - pad, cy);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', cx, 7);
      ctx.fillText('S', cx, h - 7);
      ctx.fillText('W', 7, cy);
      ctx.fillText('E', w - 7, cy);

      // Coordinate mapping helpers
      const mapX = (x: number) => cx + x * scale;
      const mapY = (z: number) => cy + z * scale;

      // 4. Cartographic Zone Markers (9 zones total)
      // Zone: South-West Irrigation Lake (-35, 35)
      const lakeX = mapX(-35);
      const lakeY = mapY(35);
      const lakeR = 20 * scale;
      ctx.beginPath();
      ctx.arc(lakeX, lakeY, lakeR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(29, 112, 184, 0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Lake pier
      ctx.beginPath();
      ctx.moveTo(mapX(-35), mapY(16.5));
      ctx.lineTo(mapX(-35), mapY(25.5));
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Zone: North-East Commercial Trellis Rows (35, -32)
      for (let tr = -2; tr <= 2; tr++) {
        const rowZ = mapY(-32 + tr * 4.2);
        ctx.beginPath();
        ctx.moveTo(mapX(24), rowZ);
        ctx.lineTo(mapX(46), rowZ);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Zone: North-West Wildflower Sanctuary (-35, -35)
      ctx.beginPath();
      ctx.arc(mapX(-35), mapY(-35), 14 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Zone: South-East Windmill Hill (38, 40)
      ctx.beginPath();
      ctx.arc(mapX(38), mapY(40), 16 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Zone: Central Greenhouse Laboratory (0, 0)
      const ghW = 18 * scale;
      const ghH = 14 * scale;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.fillRect(cx - ghW / 2, cy - ghH / 2, ghW, ghH);
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(cx - ghW / 2, cy - ghH / 2, ghW, ghH);
      ctx.fillStyle = '#A7F3D0';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('LAB', cx, cy);

      // ── NEW BIOME ZONES (Sprint 1 Expansion) ──

      // Zone: Ancient Ruins (0, -65) — dark stone purple
      const ruinsX = mapX(0);
      const ruinsY = mapY(-65);
      ctx.beginPath();
      ctx.arc(ruinsX, ruinsY, 20 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 90, 130, 0.38)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 180, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Crystal altar marker
      ctx.fillStyle = 'rgba(136, 255, 200, 0.9)';
      ctx.beginPath();
      ctx.arc(ruinsX, ruinsY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200, 180, 255, 0.85)';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏛️ RUINS', ruinsX, ruinsY + 18 * scale + 9);

      // Zone: Rice Field (80, 10) — golden yellow
      const riceX = mapX(80);
      const riceY = mapY(10);
      ctx.fillStyle = 'rgba(180, 160, 20, 0.32)';
      ctx.fillRect(riceX - 22 * scale, riceY - 32 * scale, 44 * scale, 64 * scale);
      ctx.strokeStyle = 'rgba(212, 160, 23, 0.75)';
      ctx.lineWidth = 1;
      ctx.strokeRect(riceX - 22 * scale, riceY - 32 * scale, 44 * scale, 64 * scale);
      // Canal line
      ctx.beginPath();
      ctx.moveTo(riceX - 18 * scale, riceY - 28 * scale);
      ctx.lineTo(riceX - 18 * scale, riceY + 28 * scale);
      ctx.strokeStyle = 'rgba(56, 140, 200, 0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🌾 SAWAH', riceX, riceY - 32 * scale - 6);

      // Zone: Mushroom Forest (-80, 10) — deep purple
      const mxMap = mapX(-80);
      const myMap = mapY(10);
      ctx.beginPath();
      ctx.arc(mxMap, myMap, 24 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(80, 20, 120, 0.38)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(160, 80, 240, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Cave marker
      ctx.fillStyle = 'rgba(180, 100, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(mxMap + 14 * scale, myMap + 8 * scale, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(160, 80, 240, 0.85)';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🍄 JAMUR', mxMap, myMap - 24 * scale - 6);

      // Zone: Harvest Bazaar (0, 80) — warm orange
      const bzX = mapX(0);
      const bzY = mapY(80);
      ctx.fillStyle = 'rgba(180, 100, 20, 0.32)';
      ctx.fillRect(bzX - 30 * scale, bzY - 22 * scale, 60 * scale, 40 * scale);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bzX - 30 * scale, bzY - 22 * scale, 60 * scale, 40 * scale);
      // Fountain center dot
      ctx.fillStyle = 'rgba(255, 200, 80, 0.9)';
      ctx.beginPath();
      ctx.arc(bzX, bzY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏪 BAZAAR', bzX, bzY + 22 * scale + 9);

      // 5. Active Golden Collectibles
      const items = engineRef.current?.getActiveCollectibles() || [];
      items.forEach((it) => {
        const ix = mapX(it.x);
        const iy = mapY(it.z);
        ctx.beginPath();
        ctx.arc(ix, iy, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FBBF24';
        ctx.fill();
        ctx.strokeStyle = '#FFFBEB';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // 6. Player Marker & Facing Direction
      const p = playerCoordsRef.current;
      const px = mapX(p.x);
      const py = mapY(p.z);

      // Heading Directional Arrow Pointer
      const headLen = 11;
      const tipX = px + Math.sin(p.heading) * headLen;
      const tipY = py + Math.cos(p.heading) * headLen;
      const leftWingX = px + Math.sin(p.heading + 2.4) * 5.5;
      const leftWingY = py + Math.cos(p.heading + 2.4) * 5.5;
      const rightWingX = px + Math.sin(p.heading - 2.4) * 5.5;
      const rightWingY = py + Math.cos(p.heading - 2.4) * 5.5;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(leftWingX, leftWingY);
      ctx.lineTo(px, py);
      ctx.lineTo(rightWingX, rightWingY);
      ctx.closePath();
      ctx.fillStyle = '#38BDF8';
      ctx.fill();

      // Red Tomato Player Marker Dot
      ctx.beginPath();
      ctx.arc(px, py, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    };

    renderRadar();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [showMiniMap, miniMapExpanded, isMobileLandscape, engineRef, playerCoordsRef]);

  if (!showMiniMap) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: isMobileLandscape ? 48 : 'auto',
        bottom: isMobileLandscape ? 'auto' : 24,
        right: isMobileLandscape ? 12 : 24,
        background: 'rgba(15, 23, 42, 0.96)',
        padding: 6,
        borderRadius: 18,
        border: '1px solid rgba(52, 211, 153, 0.35)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        zIndex: 22,
      }}
    >
      {/* Radar Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '2px 4px',
          fontSize: 9,
          color: '#34D399',
          fontWeight: 700,
          letterSpacing: '0.08em',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Navigation size={10} color="#34D399" />
          <span>RADAR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: '#FCD34D', fontSize: 9 }}>
            {remainingCollectibles} 🍅
          </span>
          <button
            onClick={() => setMiniMapExpanded((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 1,
              display: 'flex',
              alignItems: 'center',
            }}
            title={miniMapExpanded ? 'Perkecil Radar' : 'Perbesar Radar'}
          >
            {miniMapExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
        </div>
      </div>

      {/* Radar 2D Viewport */}
      <canvas
        ref={radarCanvasRef}
        width={isMobileLandscape ? (miniMapExpanded ? 140 : 96) : (miniMapExpanded ? 190 : 136)}
        height={isMobileLandscape ? (miniMapExpanded ? 140 : 96) : (miniMapExpanded ? 190 : 136)}
        style={{
          borderRadius: 12,
          display: 'block',
          cursor: 'crosshair',
        }}
      />
    </div>
  );
};
