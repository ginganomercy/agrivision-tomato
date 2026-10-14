import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Zap, Sparkles } from 'lucide-react';
import type { InputState } from '../../3d/types';

export interface VirtualGamepadProps {
  isMobileLandscape: boolean;
  isTiltEnabled: boolean;
  activeKeys: Record<string, boolean>;
  handlePointerDown: (action: keyof InputState, e: React.PointerEvent<HTMLButtonElement>) => void;
  handlePointerUp: (action: keyof InputState, e: React.PointerEvent<HTMLButtonElement>) => void;
  handleJump: () => void;
  handleSpin: () => void;
  handleSwordAttack: () => void;
  handleReset: () => void;
  showMiniMap?: boolean;
  miniMapExpanded?: boolean;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  isMobileLandscape,
  isTiltEnabled,
  activeKeys,
  handlePointerDown,
  handlePointerUp,
  handleJump,
  handleSpin,
  handleSwordAttack,
  handleReset,
  showMiniMap = false,
  miniMapExpanded = false,
}) => {
  return (
    <>
      {/* LEFT THUMB ZONE: Directional D-Pad (Up, Left, Down, Right) */}
      <div
        style={{
          position: 'absolute',
          bottom: isMobileLandscape ? 14 : 24,
          left: isMobileLandscape ? 16 : 24,
          background: 'rgba(15, 23, 42, 0.95)',
          padding: isMobileLandscape ? '10px 12px' : '10px 14px',
          borderRadius: 22,
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          zIndex: 25,
          touchAction: 'none',
        }}
      >
        <span
          style={{
            fontSize: 9,
            letterSpacing: '0.08em',
            color: '#94A3B8',
            fontFamily: 'monospace',
            fontWeight: 700,
          }}
        >
          {isMobileLandscape ? 'KIRI: ARAH' : 'WASD GAMEPAD'}
        </span>

        {/* Up Button */}
        <button
          onPointerDown={(e) => handlePointerDown('forward', e)}
          onPointerUp={(e) => handlePointerUp('forward', e)}
          onPointerCancel={(e) => handlePointerUp('forward', e)}
          style={{
            width: isMobileLandscape ? 50 : 44,
            height: isMobileLandscape ? 50 : 44,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              activeKeys['forward'] || activeKeys['w'] || activeKeys['arrowup']
                ? '#10B981'
                : 'rgba(30, 41, 59, 0.9)',
            border: '1.5px solid rgba(255, 255, 255, 0.22)',
            color: '#FFF',
            cursor: 'pointer',
            boxShadow:
              activeKeys['forward'] || activeKeys['w']
                ? '0 0 16px rgba(16, 185, 129, 0.6)'
                : 'none',
            touchAction: 'none',
          }}
          title="Maju (W)"
        >
          <ArrowUp size={24} />
        </button>

        {/* Left, Down, Right Horizontal Row */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onPointerDown={(e) => handlePointerDown('left', e)}
            onPointerUp={(e) => handlePointerUp('left', e)}
            onPointerCancel={(e) => handlePointerUp('left', e)}
            style={{
              width: isMobileLandscape ? 50 : 44,
              height: isMobileLandscape ? 50 : 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                activeKeys['left'] || activeKeys['a'] || activeKeys['arrowleft']
                  ? '#10B981'
                  : 'rgba(30, 41, 59, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow:
                activeKeys['left'] || activeKeys['a']
                  ? '0 0 16px rgba(16, 185, 129, 0.6)'
                  : 'none',
              touchAction: 'none',
            }}
            title="Kiri (A)"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            onPointerDown={(e) => handlePointerDown('backward', e)}
            onPointerUp={(e) => handlePointerUp('backward', e)}
            onPointerCancel={(e) => handlePointerUp('backward', e)}
            style={{
              width: isMobileLandscape ? 50 : 44,
              height: isMobileLandscape ? 50 : 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                activeKeys['backward'] || activeKeys['s'] || activeKeys['arrowdown']
                  ? '#10B981'
                  : 'rgba(30, 41, 59, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow:
                activeKeys['backward'] || activeKeys['s']
                  ? '0 0 16px rgba(16, 185, 129, 0.6)'
                  : 'none',
              touchAction: 'none',
            }}
            title="Mundur (S)"
          >
            <ArrowDown size={24} />
          </button>
          <button
            onPointerDown={(e) => handlePointerDown('right', e)}
            onPointerUp={(e) => handlePointerUp('right', e)}
            onPointerCancel={(e) => handlePointerUp('right', e)}
            style={{
              width: isMobileLandscape ? 50 : 44,
              height: isMobileLandscape ? 50 : 44,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                activeKeys['right'] || activeKeys['d'] || activeKeys['arrowright']
                  ? '#10B981'
                  : 'rgba(30, 41, 59, 0.9)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              color: '#FFF',
              cursor: 'pointer',
              boxShadow:
                activeKeys['right'] || activeKeys['d']
                  ? '0 0 16px rgba(16, 185, 129, 0.6)'
                  : 'none',
              touchAction: 'none',
            }}
            title="Kanan (D)"
          >
            <ArrowRight size={24} />
          </button>
        </div>

        {/* On desktop/portrait mode: inline actions underneath D-pad */}
        {!isMobileLandscape && (
          <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
            <button
              onPointerDown={(e) => handlePointerDown('turbo', e)}
              onPointerUp={(e) => handlePointerUp('turbo', e)}
              onPointerCancel={(e) => handlePointerUp('turbo', e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                height: 28,
                padding: '0 8px',
                borderRadius: 8,
                background:
                  activeKeys['turbo'] || activeKeys['shift']
                    ? '#0284C7'
                    : 'rgba(2, 132, 199, 0.25)',
                border: '1px solid #0284C7',
                color: '#FFF',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'none',
              }}
              title="Turbo Sprint (Shift)"
            >
              <Zap size={11} />
              <span>TURBO</span>
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleJump();
              }}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 8,
                background: 'rgba(5, 150, 105, 0.25)',
                border: '1px solid #10B981',
                color: '#34D399',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'none',
              }}
              title="Melompat (Spasi)"
            >
              JUMP
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleSpin();
              }}
              style={{
                height: 28,
                padding: '0 8px',
                borderRadius: 8,
                background: 'rgba(225, 29, 72, 0.25)',
                border: '1px solid #FB7185',
                color: '#FDA4AF',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'none',
              }}
              title="360 Akrobatik Spin (E)"
            >
              SPIN
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleSwordAttack();
              }}
              style={{
                height: 28,
                padding: '0 8px',
                borderRadius: 8,
                background: 'rgba(234, 179, 8, 0.25)',
                border: '1px solid #FDE047',
                color: '#FEF08A',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                touchAction: 'none',
              }}
              title="Tebas Pedang Daun Botani (F)"
            >
              ⚔️ TEBAS
            </button>
          </div>
        )}
      </div>

      {/* RIGHT THUMB ZONE (In Mobile Landscape Mode): Dedicated Round Action Cluster */}
      {isMobileLandscape && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
            zIndex: 25,
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          {/* Reset Pill */}
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 12px',
              borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.90)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#CBD5E1',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} color="#34D399" />
            <span>Reset Posisi</span>
          </button>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* If Tilt steering is ON: Dedicated GAS/PEDAL MAJU Button */}
            {isTiltEnabled && (
              <button
                onPointerDown={(e) => handlePointerDown('forward', e)}
                onPointerUp={(e) => handlePointerUp('forward', e)}
                onPointerCancel={(e) => handlePointerUp('forward', e)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: activeKeys['forward']
                    ? '#059669'
                    : 'rgba(16, 185, 129, 0.45)',
                  border: '2.5px solid #34D399',
                  color: '#FFF',
                  cursor: 'pointer',
                  boxShadow: activeKeys['forward']
                    ? '0 0 18px rgba(16, 185, 129, 0.7)'
                    : '0 4px 14px rgba(16, 185, 129, 0.35)',
                  touchAction: 'none',
                }}
                title="Tahan untuk Gas / Melaju (Tilt Mode)"
              >
                <Zap size={18} color="#A7F3D0" />
                <span style={{ fontSize: 9, fontWeight: 900, color: '#A7F3D0' }}>
                  GAS
                </span>
              </button>
            )}

            {/* Turbo Sprint (Round Blue) */}
            <button
              onPointerDown={(e) => handlePointerDown('turbo', e)}
              onPointerUp={(e) => handlePointerUp('turbo', e)}
              onPointerCancel={(e) => handlePointerUp('turbo', e)}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: activeKeys['turbo']
                  ? '#0284C7'
                  : 'rgba(2, 132, 199, 0.35)',
                border: '2px solid #38BDF8',
                color: '#FFF',
                cursor: 'pointer',
                boxShadow: activeKeys['turbo']
                  ? '0 0 16px rgba(56, 189, 248, 0.7)'
                  : '0 4px 14px rgba(2, 132, 199, 0.35)',
                touchAction: 'none',
              }}
              title="Turbo Sprint (Shift)"
            >
              <Zap size={16} />
              <span style={{ fontSize: 8, fontWeight: 800 }}>TURBO</span>
            </button>

            {/* Acrobatic Spin (Round Rose) */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleSpin();
              }}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(225, 29, 72, 0.35)',
                border: '2px solid #FB7185',
                color: '#FDA4AF',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                touchAction: 'none',
              }}
              title="Serang Putar Spin (E)"
            >
              <Sparkles size={16} />
              <span style={{ fontSize: 7.5, fontWeight: 800 }}>PUTAR</span>
            </button>

            {/* Sword Melee Attack (Round Amber) */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleSwordAttack();
              }}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(135deg, rgba(234, 179, 8, 0.8), rgba(239, 68, 68, 0.8))',
                border: '2.5px solid #FDE047',
                color: '#FFF',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(234, 179, 8, 0.55)',
                touchAction: 'none',
              }}
              title="Tebas Pedang Daun Botani (F)"
            >
              <span style={{ fontSize: 16 }}>⚔️</span>
              <span style={{ fontSize: 7.5, fontWeight: 900, color: '#FEF08A' }}>
                TEBAS
              </span>
            </button>

            {/* Primary Jump (Large Round Emerald) */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleJump();
              }}
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(16, 185, 129, 0.55)',
                border: '3px solid #34D399',
                color: '#FFF',
                cursor: 'pointer',
                boxShadow: '0 6px 22px rgba(16, 185, 129, 0.55)',
                touchAction: 'none',
              }}
              title="Melompat (Spasi)"
            >
              <ArrowUp size={24} color="#34D399" />
              <span style={{ fontSize: 10, fontWeight: 900, color: '#A7F3D0' }}>
                LOMPAT
              </span>
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP RESET BUTTON (When NOT in mobile landscape mode) */}
      {!isMobileLandscape && (
        <div
          style={{
            position: 'absolute',
            bottom: showMiniMap ? (miniMapExpanded ? 260 : 195) : 24,
            right: 24,
            pointerEvents: 'auto',
            zIndex: 15,
            transition: 'bottom 0.2s ease',
          }}
        >
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 14,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#E2E8F0',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transition: 'all 0.2s',
            }}
            title="Kembalikan karakter tomat ke pintu laboratorium (R)"
          >
            <RotateCcw size={13} color="#34D399" />
            <span>Reset Posisi</span>
          </button>
        </div>
      )}
    </>
  );
};
