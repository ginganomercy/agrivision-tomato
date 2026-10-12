import React from 'react';
import { X } from 'lucide-react';
import type { InventoryItem } from '../../../3d/types';

interface InventoryModalProps {
  isOpen: boolean;
  items: InventoryItem[];
  selectedItem: InventoryItem | null;
  activeCategoryFilter: string;
  useFeedback: string | null;
  isMobileLandscape: boolean;
  onSelectItem: (item: InventoryItem) => void;
  onFilterChange: (category: string) => void;
  onUseItem: (itemId: string) => void;
  onEquipWeapon: (itemId: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  items,
  selectedItem,
  activeCategoryFilter,
  useFeedback,
  isMobileLandscape,
  onSelectItem,
  onFilterChange,
  onUseItem,
  onEquipWeapon,
  onClose
}) => {
  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Semua', icon: '📦' },
    { id: 'weapon', label: 'Senjata', icon: '🗡️' },
    { id: 'produce', label: 'Panen', icon: '🌱' },
    { id: 'consumable', label: 'Konsumsi', icon: '🧪' },
    { id: 'loot', label: 'Loot Hama', icon: '🪲' }
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(3, 7, 18, 0.78)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 80,
      padding: isMobileLandscape ? 12 : 20,
      pointerEvents: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobileLandscape ? 680 : 560,
        maxHeight: isMobileLandscape ? '94vh' : '88vh',
        background: 'rgba(15, 23, 42, 0.96)',
        border: '1.5px solid rgba(52, 211, 153, 0.4)',
        borderRadius: 24,
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(16, 185, 129, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(30, 41, 59, 0.45)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎒</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.03em' }}>
                TAS & INVENTORI PETANI
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Slot Terisi: {items.length} / 16 • Tekan [I] atau [Esc] untuk tutup
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: 10,
              color: '#CBD5E1',
              padding: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '8px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          overflowX: 'auto'
        }}>
          {categories.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                background: activeCategoryFilter === tab.id ? '#10B981' : 'rgba(30, 41, 59, 0.6)',
                border: `1px solid ${activeCategoryFilter === tab.id ? '#34D399' : 'rgba(255, 255, 255, 0.08)'}`,
                color: '#FFF',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body: Left Grid + Right Inspector */}
        <div style={{
          display: 'flex',
          flexDirection: isMobileLandscape ? 'row' : 'column',
          padding: 16,
          gap: 14,
          overflowY: 'auto'
        }}>
          {/* 16-Slot Grid */}
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8
          }}>
            {Array.from({ length: 16 }).map((_, index) => {
              const filtered = activeCategoryFilter === 'all' 
                ? items 
                : items.filter(i => i.category === activeCategoryFilter);
              const item = filtered[index];
              const isSelected = selectedItem && item && selectedItem.id === item.id;

              if (!item) {
                return (
                  <div
                    key={`empty_${index}`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 14,
                      background: 'rgba(30, 41, 59, 0.25)',
                      border: '1.5px dashed rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255, 255, 255, 0.12)',
                      fontSize: 11,
                      fontFamily: 'monospace'
                    }}
                  >
                    {index + 1}
                  </div>
                );
              }

              const rarityBorder = 
                item.rarity === 'legendary' ? '#F59E0B' :
                item.rarity === 'epic' ? '#A855F7' :
                item.rarity === 'rare' ? '#38BDF8' : '#10B981';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 14,
                    background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                    border: `2px solid ${isSelected ? '#34D399' : rarityBorder}`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.5)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  {item.count > 1 && (
                    <span style={{
                      position: 'absolute',
                      bottom: 3,
                      right: 5,
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#FFF',
                      background: 'rgba(0, 0, 0, 0.8)',
                      padding: '1px 5px',
                      borderRadius: 6
                    }}>
                      x{item.count}
                    </span>
                  )}
                  {item.isEquipped && (
                    <span style={{
                      position: 'absolute',
                      top: 3,
                      left: 4,
                      fontSize: 8,
                      fontWeight: 900,
                      color: '#FDE047',
                      background: 'rgba(0, 0, 0, 0.85)',
                      padding: '1px 4px',
                      borderRadius: 4,
                      border: '1px solid #EAB308'
                    }}>
                      E
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Item Inspector Pane */}
          <div style={{
            width: isMobileLandscape ? 230 : '100%',
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: 16,
            padding: 12,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {selectedItem ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{selectedItem.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>
                      {selectedItem.name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: selectedItem.rarity === 'epic' ? '#C084FC' : selectedItem.rarity === 'rare' ? '#38BDF8' : '#34D399'
                    }}>
                      {selectedItem.rarity} • {selectedItem.category}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#CBD5E1', lineHeight: 1.45, marginBottom: 10 }}>
                  {selectedItem.description}
                </div>
                {selectedItem.attackBonus && (
                  <div style={{ fontSize: 11, color: '#F87171', fontWeight: 700, marginBottom: 4 }}>
                    ⚔️ Bonus Serangan: +{selectedItem.attackBonus} ATK
                  </div>
                )}
                {selectedItem.speedBonus && (
                  <div style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700, marginBottom: 4 }}>
                    ⚡ Dorongan Gerak: +{Math.round(selectedItem.speedBonus * 100)}% SPD
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center', margin: 'auto 0' }}>
                Pilih item di tas untuk melihat rincian & menggunakan.
              </div>
            )}

            {/* Action Button inside Inspector */}
            {selectedItem && (
              <div style={{ marginTop: 10 }}>
                {selectedItem.category === 'weapon' ? (
                  <button
                    disabled={selectedItem.isEquipped}
                    onClick={() => onEquipWeapon(selectedItem.id)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      background: selectedItem.isEquipped ? 'rgba(100, 116, 139, 0.4)' : '#0284C7',
                      border: 'none',
                      color: '#FFF',
                      cursor: selectedItem.isEquipped ? 'default' : 'pointer'
                    }}
                  >
                    {selectedItem.isEquipped ? '✓ Terpasang' : 'Pasang Senjata'}
                  </button>
                ) : selectedItem.category === 'consumable' ? (
                  <button
                    onClick={() => onUseItem(selectedItem.id)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      background: '#10B981',
                      border: 'none',
                      color: '#FFF',
                      cursor: 'pointer'
                    }}
                  >
                    Gunakan Item
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Action feedback message */}
        {useFeedback && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(16, 185, 129, 0.2)',
            borderTop: '1px solid rgba(16, 185, 129, 0.4)',
            fontSize: 11,
            color: '#34D399',
            textAlign: 'center',
            fontWeight: 600
          }}>
            {useFeedback}
          </div>
        )}
      </div>
    </div>
  );
};
