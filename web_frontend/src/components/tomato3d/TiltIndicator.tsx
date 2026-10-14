import React from 'react';
import { Smartphone } from 'lucide-react';

export interface TiltIndicatorProps {
  isTiltEnabled: boolean;
  isMobileLandscape: boolean;
  tiltTextRef: React.RefObject<HTMLSpanElement | null>;
}

export const TiltIndicator: React.FC<TiltIndicatorProps> = ({
  isTiltEnabled,
  isMobileLandscape,
  tiltTextRef,
}) => {
  if (!isTiltEnabled) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: isMobileLandscape ? 50 : 64,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid #10B981',
        borderRadius: 20,
        padding: '4px 14px',
        fontSize: 11,
        fontFamily: 'monospace',
        color: '#34D399',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        zIndex: 25,
        pointerEvents: 'none',
      }}
    >
      <Smartphone size={12} color="#34D399" />
      <span ref={tiltTextRef}>SEIMBANG (0°)</span>
    </div>
  );
};
