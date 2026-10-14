import React from 'react';
import type { InteractableTarget, DialogueNode } from '../../3d/types';

interface FloatingInteractButtonProps {
  target: InteractableTarget | null;
  activeDialogue: DialogueNode | null;
  isQuestBoardOpen: boolean;
  isMobileLandscape: boolean;
  onInteract: () => void;
}

export const FloatingInteractButton: React.FC<FloatingInteractButtonProps> = ({
  target,
  activeDialogue,
  isQuestBoardOpen,
  isMobileLandscape,
  onInteract
}) => {
  if (!target || activeDialogue || isQuestBoardOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: isMobileLandscape ? 20 : 80,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      pointerEvents: 'auto'
    }}>
      <button
        onClick={onInteract}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.95), rgba(202, 138, 4, 0.95))',
          border: '2px solid #FEF08A',
          borderRadius: 30,
          color: '#1C1917',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.3px',
          boxShadow: '0 6px 24px rgba(234, 179, 8, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <span style={{
          background: '#1C1917',
          color: '#FEF08A',
          padding: '2px 8px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 900
        }}>
          E
        </span>
        <span>{target.promptText}</span>
      </button>
    </div>
  );
};
