import React from 'react';
import type { RoomTransition } from '../../../3d/types';

interface RoomTransitionModalProps {
  transition: RoomTransition | null;
}

export const RoomTransitionModal: React.FC<RoomTransitionModalProps> = ({ transition }) => {
  if (!transition?.isTransitioning) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, #030712 75%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      pointerEvents: 'all',
      color: '#FFF',
      textAlign: 'center',
      padding: 24
    }}>
      <div style={{
        width: 76,
        height: 76,
        borderRadius: '50%',
        background: 'rgba(16, 185, 129, 0.18)',
        border: '2px solid #34D399',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        boxShadow: '0 0 32px rgba(16, 185, 129, 0.5)',
        marginBottom: 16
      }}>
        {transition.icon}
      </div>
      <div style={{
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: '0.4px',
        color: '#F8FAFC',
        marginBottom: 6,
        textShadow: '0 2px 10px rgba(0,0,0,0.8)'
      }}>
        {transition.title}
      </div>
      <div style={{
        fontSize: 12,
        color: '#94A3B8',
        maxWidth: 420,
        lineHeight: 1.5,
        marginBottom: 20
      }}>
        {transition.subtitle}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 16,
          height: 16,
          border: '2px solid rgba(52, 211, 153, 0.25)',
          borderTopColor: '#34D399',
          borderRadius: '50%'
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#34D399', letterSpacing: '0.06em' }}>
          MEMASUKI WILAYAH...
        </span>
      </div>
    </div>
  );
};
