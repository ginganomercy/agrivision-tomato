import React from 'react';
import type { GuildQuest } from '../../../3d/types';

interface BountyBoardModalProps {
  isOpen: boolean;
  quests: GuildQuest[];
  isMobileLandscape: boolean;
  onAcceptQuest: (questId: string) => void;
  onClaimReward: (questId: string) => void;
  onClose: () => void;
}

export const BountyBoardModal: React.FC<BountyBoardModalProps> = ({
  isOpen,
  quests,
  isMobileLandscape,
  onAcceptQuest,
  onClaimReward,
  onClose
}) => {
  if (!isOpen) return null;

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
        background: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 90,
        pointerEvents: 'auto'
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 720,
        maxHeight: '90vh',
        background: 'linear-gradient(145deg, rgba(28, 20, 14, 0.97), rgba(15, 23, 42, 0.98))',
        border: '2px solid #D97706',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(217, 119, 6, 0.25)',
        color: '#FFF'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>📜</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FEF08A', letterSpacing: '0.4px' }}>
                Papan Sayembara Serikat Tani
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Pusat Kontrak Pemburu Hama & Ekspedisi Kebun Holtikultura
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: 10,
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            ✕
          </button>
        </div>

        {/* Quests Cards List */}
        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {quests.map((quest) => {
            const isQuestActive = quest.status === 'active';
            const isCompleted = quest.status === 'completed';
            const curCount = quest.currentCount;
            const canClaim = isQuestActive && curCount >= quest.targetCount;
            const progressPct = Math.min(100, Math.round((curCount / quest.targetCount) * 100));

            return (
              <div
                key={quest.id}
                style={{
                  background: isQuestActive 
                    ? 'rgba(30, 41, 59, 0.7)' 
                    : isCompleted
                    ? 'rgba(6, 78, 59, 0.35)'
                    : 'rgba(15, 23, 42, 0.55)',
                  border: isCompleted
                    ? '1px solid #10B981'
                    : isQuestActive
                    ? '1px solid #38BDF8'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 16,
                  padding: 14,
                  display: 'flex',
                  flexDirection: isMobileLandscape ? 'row' : 'column',
                  alignItems: isMobileLandscape ? 'center' : 'stretch',
                  gap: 12,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Icon & Category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22
                  }}>
                    {quest.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
                        {quest.title}
                      </span>
                      <span style={{ fontSize: 11, color: '#FBBF24' }}>
                        {'⭐'.repeat(quest.difficulty || 1)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4, marginBottom: 6 }}>
                      {quest.description}
                    </div>

                    {/* Progress and Rewards Row */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 600 }}>
                          Target: {curCount}/{quest.targetCount} ({progressPct}%)
                        </span>
                        <div style={{ width: 60, height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            background: canClaim || isCompleted ? '#34D399' : '#38BDF8',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
                        <span style={{ color: '#FBBF24', fontWeight: 700 }}>
                          🏆 +{quest.rewardScore} Skor
                        </span>
                        {quest.rewardItemName && (
                          <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                            • 🎁 {quest.rewardItemName} x{quest.rewardItemQty || 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ minWidth: 140, display: 'flex', justifyContent: 'flex-end' }}>
                  {isCompleted ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10B981',
                        color: '#34D399',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      ✓ Selesai
                    </button>
                  ) : canClaim ? (
                    <button
                      onClick={() => onClaimReward(quest.id)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        border: '1px solid #FDE047',
                        color: '#FFF',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 0 16px rgba(245, 158, 11, 0.5)'
                      }}
                    >
                      🎁 Klaim Hadiah!
                    </button>
                  ) : isQuestActive ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'rgba(56, 189, 248, 0.2)',
                        border: '1px solid #38BDF8',
                        color: '#38BDF8',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      ⚔️ Sedang Berjalan
                    </button>
                  ) : (
                    <button
                      onClick={() => onAcceptQuest(quest.id)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        border: 'none',
                        color: '#FFF',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      📜 Terima Kontrak
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
