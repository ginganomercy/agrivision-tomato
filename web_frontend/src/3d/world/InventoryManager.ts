/**
 * InventoryManager - Comprehensive Agricultural & Adventure Inventory System
 * Manages 16 grid slots, item categorization, equipment states, consumables,
 * and loot collection from monsters and harvesting.
 */
import type { InventoryItem, ItemCategory } from '../types';

export class InventoryManager {
  private items: InventoryItem[] = [];
  public static readonly MAX_SLOTS = 16;
  private onUpdateCallback?: (items: InventoryItem[]) => void;
  private onLootCallback?: (itemName: string, icon: string, qty: number) => void;

  constructor(
    onUpdate?: (items: InventoryItem[]) => void,
    onLoot?: (itemName: string, icon: string, qty: number) => void
  ) {
    this.onUpdateCallback = onUpdate;
    this.onLootCallback = onLoot;
    this.initializeStarterItems();
  }

  private initializeStarterItems(): void {
    this.items = [
      {
        id: 'starter_blade',
        name: 'Pedang Daun Botani',
        category: 'weapon',
        rarity: 'rare',
        icon: '🗡️',
        description: 'Pedang tempaan pandai besi serikat tani. Bilah baja berukir runa daun klorofil yang mampu menebas hama kebun.',
        count: 1,
        maxStack: 1,
        attackBonus: 25,
        isEquipped: true
      },
      {
        id: 'pupuk_npk',
        name: 'Pupuk Super NPK Booster',
        category: 'consumable',
        rarity: 'common',
        icon: '🧪',
        description: 'Konsentrat nutrisi nitrogen-fosfor-kalium murni. Memberikan dorongan akselerasi gerak +35% selama 15 detik.',
        count: 3,
        maxStack: 10,
        speedBonus: 0.35
      },
      {
        id: 'benih_san_marzano',
        name: 'Benih Unggul San Marzano',
        category: 'produce',
        rarity: 'common',
        icon: '🌱',
        description: 'Benih tomat pusaka Italia kualitas terbaik dari bank plasma nutfah Laboratorium Botani.',
        count: 5,
        maxStack: 99
      }
    ];

    this.notifyUpdate();
  }

  public getItems(): InventoryItem[] {
    return [...this.items];
  }

  public getItemsByCategory(category?: ItemCategory): InventoryItem[] {
    if (!category) return this.getItems();
    return this.items.filter(item => item.category === category);
  }

  public getEquippedWeapon(): InventoryItem | undefined {
    return this.items.find(item => item.category === 'weapon' && item.isEquipped);
  }

  /**
   * Adds an item to the player's inventory or stacks onto an existing slot.
   */
  public addItem(itemTemplate: Omit<InventoryItem, 'count'>, qty: number = 1): boolean {
    // 1. Try to stack onto an existing item
    const existing = this.items.find(i => i.id === itemTemplate.id);
    if (existing && existing.count < existing.maxStack) {
      const space = existing.maxStack - existing.count;
      const added = Math.min(space, qty);
      existing.count += added;
      this.onLootCallback?.(existing.name, existing.icon, added);
      this.notifyUpdate();
      return true;
    }

    // 2. Check slot limit
    if (this.items.length >= InventoryManager.MAX_SLOTS) {
      return false; // Inventory full
    }

    // 3. Insert new slot
    const newItem: InventoryItem = {
      ...itemTemplate,
      count: Math.min(qty, itemTemplate.maxStack)
    };
    this.items.push(newItem);
    this.onLootCallback?.(newItem.name, newItem.icon, newItem.count);
    this.notifyUpdate();
    return true;
  }

  /**
   * Drops loot into inventory when a pest monster is defeated
   */
  public addMonsterLoot(monsterType: 'hornworm' | 'beetle'): void {
    if (monsterType === 'hornworm') {
      this.addItem({
        id: 'loot_hornworm_horn',
        name: 'Tanduk Ulat Hornworm',
        category: 'loot',
        rarity: 'rare',
        icon: '🪱',
        description: 'Tanduk merah keras dari larva Manduca quinquemaculata. Bahan bernilai tinggi untuk ramuan pengusir hama di Kedai.',
        maxStack: 20
      }, 1);
    } else {
      this.addItem({
        id: 'loot_beetle_carapace',
        name: 'Cangkang Kumbang Hawar',
        category: 'loot',
        rarity: 'epic',
        icon: '🪲',
        description: 'Kepingan karapas ungu berbintik oranye yang kokoh dari kumbang pembawa spora hawar daun.',
        maxStack: 20
      }, 1);
    }
  }

  /**
   * Adds golden dew drops when collecting 3D energy orbs
   */
  public addGoldenDew(): void {
    this.addItem({
      id: 'golden_dew',
      name: 'Embun Emas Murni (Golden Dew)',
      category: 'loot',
      rarity: 'rare',
      icon: '✨',
      description: 'Tetesan embun berenergi fotosintesis tinggi yang dikumpulkan dari penjuru Kebun Botani.',
      maxStack: 50
    }, 1);
  }

  /**
   * Uses a consumable item (e.g. fertilizer speed boost)
   */
  public useItem(id: string): { success: boolean; message: string; speedBoost?: number } {
    const itemIndex = this.items.findIndex(i => i.id === id);
    if (itemIndex === -1) {
      return { success: false, message: 'Item tidak ditemukan.' };
    }

    const item = this.items[itemIndex];
    if (item.category !== 'consumable') {
      return { success: false, message: 'Item ini bukan konsumsi.' };
    }

    const boost = item.speedBonus || 0;
    item.count -= 1;
    if (item.count <= 0) {
      this.items.splice(itemIndex, 1);
    }

    this.notifyUpdate();
    return {
      success: true,
      message: `${item.name} berhasil digunakan!`,
      speedBoost: boost
    };
  }

  /**
   * Equips a weapon from the inventory
   */
  public equipWeapon(id: string): { success: boolean; message: string; atk: number } {
    const target = this.items.find(i => i.id === id);
    if (!target || target.category !== 'weapon') {
      return { success: false, message: 'Bukan senjata yang valid.', atk: 0 };
    }

    // Unequip all other weapons
    this.items.forEach(i => {
      if (i.category === 'weapon') i.isEquipped = false;
    });

    target.isEquipped = true;
    this.notifyUpdate();

    return {
      success: true,
      message: `${target.name} berhasil dipasang!`,
      atk: target.attackBonus || 20
    };
  }

  private notifyUpdate(): void {
    this.onUpdateCallback?.(this.getItems());
  }

  public setCallbacks(
    onUpdate?: (items: InventoryItem[]) => void,
    onLoot?: (itemName: string, icon: string, qty: number) => void
  ): void {
    this.onUpdateCallback = onUpdate;
    this.onLootCallback = onLoot;
    this.notifyUpdate();
  }
}
