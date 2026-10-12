import React from 'react';
import type { GuildQuest } from '../../3d/types';

interface ActiveQuestWidgetProps {
  activeQuest: GuildQuest | null;
  questDefeated: number;
  isQuestCompleted: boolean;
  showQuestCelebration: boolean;
  isMobileLandscape: boolean;
  onOpenQuestBoard: () => void;
}

export const ActiveQuestWidget: React.FC<ActiveQuestWidgetProps> = ({
  activeQuest,
  questDefeated,
  isQuestCompleted,
  showQuestCelebration,
  isMobileLandscape,
  onOpenQuestBoard
}) => {
  const curCount = activeQuest ? activeQuest.currentCount : questDefeated;
  const targetCount = activeQuest ? activeQuest.targetCount : 5;
  const progressPercent = Math.min(100, (curCount / targetCount) * 100);
  const isDone = (activeQuest?.status === 'completed') || isQuestCompleted;

  return (
    <>
      {/* ⚔️ / 📜 ACTIVE GUILD BOUNTY HUD */}
      <div 
        onClick={onOpenQuestBoard}
        style={{
          position: 'absolute',
          top: isMobileLandscape ? 8 : 64,
          left: 12,
          background: isDone 
            ? 'rgba(6, 78, 59, 0.88)' 
            : 'rgba(15, 23, 42, 0.85)',
          border: isDone
            ? '1px solid #34D399'
            : '1px solid rgba(234, 179, 8, 0.5)',
          borderRadius: 14,
          padding: '7px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: isDone ? '0 4px 16px rgba(16, 185, 129, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
          zIndex: 22,
          pointerEvents: 'auto',
          cursor: 'pointer',
          maxWidth: 290
        }}
        title="Klik untuk membuka Papan Sayembara Serikat Tani"
      >
        <span style={{ fontSize: 17 }}>
          {isDone ? '🏆' : (activeQuest?.icon || '⚔️')}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <span style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: isDone ? '#34D399' : '#FBBF24',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {activeQuest ? activeQuest.title : 'Bounty: Basmi Hama Kebun'}
            </span>
            <span style={{ fontSize: 8.5, color: '#94A3B8', fontWeight: 700 }}>
              [PAPAN]
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10.5, color: '#E2E8F0', fontWeight: 600 }}>
              {activeQuest 
                ? `${activeQuest.currentCount} / ${activeQuest.targetCount} ${activeQuest.category === 'bounty' ? 'Hama' : activeQuest.category === 'gathering' ? 'Embun' : 'Survei'}`
                : `${questDefeated} / 5 Hama Dikalahkan`}
            </span>
            {activeQuest && (
              <span style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: curCount >= targetCount ? '#34D399' : '#FEF08A'
              }}>
                {curCount >= targetCount 
                  ? (activeQuest.status === 'completed' ? 'Tuntas' : 'Siap Klaim!') 
                  : `+${activeQuest.rewardScore}`}
              </span>
            )}
          </div>
        </div>
        {/* Progress Bar */}
        <div style={{ width: 40, height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: curCount >= targetCount
              ? 'linear-gradient(90deg, #10B981, #34D399)'
              : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* 🎉 Quest Complete Celebration Banner */}
      {showQuestCelebration && (
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '2px solid #6EE7B7',
          borderRadius: 20,
          padding: '16px 28px',
          color: '#FFFFFF',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(16, 185, 129, 0.4), 0 0 30px rgba(110, 231, 183, 0.6)',
          zIndex: 40,
          pointerEvents: 'none',
          animation: 'bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🎉 🏆 🍅</div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.5px' }}>
            KONTRAK SAYEMBARA SELESAI!
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#D1FAE5', marginTop: 4 }}>
            Semua Hama Berhasil Diberantas • Kebun Botani Aman!
          </div>
          <div style={{ fontSize: 11, color: '#A7F3D0', marginTop: 6, fontWeight: 700 }}>
            +500 Skor Hadiah • Buka Papan Sayembara untuk Misi Lanjutan
          </div>
        </div>
      )}
    </>
  );
};
