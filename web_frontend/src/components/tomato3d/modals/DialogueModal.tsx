import React from 'react';
import type { DialogueNode, DialogueOption } from '../../../3d/types';

interface DialogueModalProps {
  dialogue: DialogueNode | null;
  isMobileLandscape: boolean;
  onSelectOption: (option: DialogueOption) => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  dialogue,
  isMobileLandscape,
  onSelectOption,
  onClose
}) => {
  if (!dialogue) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(5, 5, 10, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: isMobileLandscape ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: isMobileLandscape ? 12 : 24,
        zIndex: 100,
        pointerEvents: 'auto'
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 640,
        background: 'linear-gradient(145deg, rgba(30, 22, 16, 0.96), rgba(15, 23, 42, 0.98))',
        border: '2px solid rgba(234, 179, 8, 0.6)',
        borderRadius: 20,
        padding: isMobileLandscape ? 14 : 20,
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(234, 179, 8, 0.2)',
        color: '#FFF',
        position: 'relative'
      }}>
        {/* Header with Avatar & Speaker Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(16, 185, 129, 0.2))',
            border: '2px solid #FBBF24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
          }}>
            {dialogue.speakerAvatar || dialogue.speakerIcon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FEF08A', letterSpacing: '0.4px' }}>
              {dialogue.speakerName || dialogue.speaker}
            </div>
            {dialogue.speakerTitle && (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {dialogue.speakerTitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            ✕
          </button>
        </div>

        {/* Speech Text */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 14,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: isMobileLandscape ? 12 : 13.5,
          lineHeight: 1.6,
          color: '#F1F5F9',
          fontStyle: 'italic'
        }}>
          "{dialogue.text}"
        </div>

        {/* Dialogue Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dialogue.options.map((opt, i) => {
            const isBountyAction = opt.action === 'open_bounty_board' || opt.action === 'open_quest_board';
            return (
              <button
                key={i}
                onClick={() => onSelectOption(opt)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: isBountyAction 
                    ? 'linear-gradient(90deg, rgba(234, 179, 8, 0.25), rgba(202, 138, 4, 0.15))'
                    : 'rgba(255, 255, 255, 0.06)',
                  border: isBountyAction
                    ? '1px solid rgba(234, 179, 8, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isBountyAction ? '#FEF08A' : '#E2E8F0',
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ color: '#FBBF24', fontSize: 13 }}>▸</span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
