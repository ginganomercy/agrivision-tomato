/**
 * QuestManager - Agri-Guild Bounty Board & Quest Lifecycle System
 * Orchestrates multi-tier agricultural guild bounties, active quest tracking,
 * real-time objective progression, and celebration reward claims.
 */
import type { GuildQuest } from '../types';

export class QuestManager {
  private quests: GuildQuest[] = [
    {
      id: 'quest_hornworm_hunt',
      title: 'Perburuan Ulat Tanduk Hijau',
      subtitle: 'Bersihkan Kebun Trellis dari Hama Penggerek',
      category: 'bounty',
      targetType: 'hornworm',
      targetCount: 3,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 350,
      rewardItemName: 'Tanduk Ulat Hornworm',
      rewardItemIcon: '🐛',
      rewardItemQty: 2,
      status: 'active', // Active by default as beginner tutorial quest
      description: 'Ulat tanduk hijau rakus mulai menggerogoti tunas daun tomat di Zona 1. Basmi 3 ulat menggunakan tebasan pedang atau lompatan injak.',
      icon: '🐛',
      difficulty: 1
    },
    {
      id: 'quest_blight_beetle',
      title: 'Serbuan Kumbang Hawar Hitam',
      subtitle: 'Amankan Taman Bunga & Polinator',
      category: 'bounty',
      targetType: 'beetle',
      targetCount: 2,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 500,
      rewardItemName: 'Cangkang Kumbang Hawar',
      rewardItemIcon: '🪲',
      rewardItemQty: 2,
      status: 'available',
      description: 'Kumbang berkarapas keras terdeteksi membawa spora hawar daun di Zona 2. Kalahkan 2 kumbang hawar untuk mengamankan lebah penyerbuk.',
      icon: '🪲',
      difficulty: 2
    },
    {
      id: 'quest_golden_dew',
      title: 'Ekspedisi Embun Emas Danau',
      subtitle: 'Kumpulkan Energi Murni di Danau Irigasi',
      category: 'gathering',
      targetType: 'dew',
      targetCount: 6,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 400,
      rewardItemName: 'Pupuk Super NPK Booster',
      rewardItemIcon: '🧪',
      rewardItemQty: 1,
      status: 'available',
      description: 'Embun emas terkondensasi di sepanjang Jembatan Danau dan Paviliun Gazebo. Kumpulkan 6 tetes embun untuk memformulasi nutrisi cair.',
      icon: '💧',
      difficulty: 2
    },
    {
      id: 'quest_windmill_survey',
      title: 'Inspeksi Turbin Kincir Angin',
      subtitle: 'Titik Pantau Cuaca Perbukitan Timur',
      category: 'exploration',
      targetType: 'windmill',
      targetCount: 1,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 300,
      rewardItemName: 'Benih Unggul San Marzano',
      rewardItemIcon: '🌱',
      rewardItemQty: 3,
      status: 'available',
      description: 'Naik ke tangga dek observasi kincir angin di bukit timur untuk memeriksa kecepatan angin dan kelembapan udara perkebunan.',
      icon: '🌾',
      difficulty: 1
    },
    {
      id: 'quest_explorer',
      title: 'Petani Penjelajah Nusantara',
      subtitle: 'Jelajahi Semua Zona Baru di Peta Agrivision',
      category: 'exploration',
      targetType: 'explore_zone',
      targetCount: 4,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 600,
      rewardItemName: 'Peta Agrivision Premium',
      rewardItemIcon: '🗺️',
      rewardItemQty: 1,
      status: 'available',
      description: 'Empat zona baru telah ditemukan! Kunjungi Reruntuhan Kuno, Sawah Irigasi, Hutan Jamur, dan Pasar Panen untuk mendapatkan penghargaan Penjelajah Ulung.',
      icon: '🗺️',
      difficulty: 2
    },
    {
      id: 'quest_rune_hunter',
      title: 'Arkeolog Pemula',
      subtitle: 'Temukan Prasasti Kuno di Reruntuhan Utara',
      category: 'exploration',
      targetType: 'ruins',
      targetCount: 3,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 450,
      rewardItemName: 'Fragmen Prasasti Kuno',
      rewardItemIcon: '🏛️',
      rewardItemQty: 2,
      status: 'available',
      description: 'Reruntuhan agrikultura kuno di utara menyimpan 4 batu runa yang terpencar. Kunjungi area Reruntuhan dan selidiki altar kristal bercahaya untuk mengungkap sejarah pertanian leluhur.',
      icon: '🏛️',
      difficulty: 2
    },
    {
      id: 'quest_mushroom_pest',
      title: 'Pengusir Aphid Cloud',
      subtitle: 'Basmi Hama Kutu Daun di Hutan Jamur',
      category: 'bounty',
      targetType: 'monster',
      targetCount: 5,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 550,
      rewardItemName: 'Serbuk Jamur Mistis',
      rewardItemIcon: '🍄',
      rewardItemQty: 3,
      status: 'available',
      description: 'Gerombolan kutu daun bersayap (Aphid Cloud) menyerbu Hutan Jamur Misterius di barat. Basmi 5 gerombolan menggunakan tebasan pedang untuk melindungi ekosistem jamur yang berharga.',
      icon: '🍄',
      difficulty: 3
    },
    {
      id: 'quest_harvest_bazaar',
      title: 'Pelanggan Setia Pasar Panen',
      subtitle: 'Kunjungi Seluruh Kios di Pasar Panen Selatan',
      category: 'exploration',
      targetType: 'bazaar',
      targetCount: 1,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 280,
      rewardItemName: 'Voucher Pasar Premium',
      rewardItemIcon: '🏪',
      rewardItemQty: 1,
      status: 'available',
      description: 'Pasar Panen Terbuka di selatan kini dibuka untuk umum! Kunjungi plaza pasar dan nikmati suasana festival panen dengan 6 kios pedagang lokal yang menjual hasil bumi terbaik.',
      icon: '🏪',
      difficulty: 1
    },
    {
      id: 'quest_rice_harvest',
      title: 'Ekspedisi Sawah Timur',
      subtitle: 'Jelajahi Lahan Sawah & Sungai Irigasi',
      category: 'exploration',
      targetType: 'rice',
      targetCount: 1,
      currentCount: 0,
      currentProgress: 0,
      rewardScore: 320,
      rewardItemName: 'Beras Aromatik Premium',
      rewardItemIcon: '🌾',
      rewardItemQty: 5,
      status: 'available',
      description: 'Lahan sawah irigasi di timur jauh siap panen! Kunjungi sawah dan amati sistem irigasi tradisional — kanal air, kincir bambu, dan orang-orangan sawah yang menjaga padi dari hama.',
      icon: '🌾',
      difficulty: 1
    }
  ];

  public onQuestComplete?: (quest: GuildQuest) => void;
  private onQuestsUpdate?: (quests: GuildQuest[]) => void;
  private onActiveQuestChange?: (quest: GuildQuest | null) => void;

  constructor(
    onQuestsUpdate?: (quests: GuildQuest[]) => void,
    onActiveQuestChange?: (quest: GuildQuest | null) => void
  ) {
    this.onQuestsUpdate = onQuestsUpdate;
    this.onActiveQuestChange = onActiveQuestChange;
  }

  public getQuests(): GuildQuest[] {
    return [...this.quests];
  }

  public getActiveQuest(): GuildQuest | null {
    return this.quests.find(q => q.status === 'active' || q.status === 'completed') || null;
  }

  public acceptQuest(questId: string): { success: boolean; message: string; quest?: GuildQuest } {
    const targetQuest = this.quests.find(q => q.id === questId);
    if (!targetQuest) {
      return { success: false, message: 'Sayembara tidak ditemukan di papan serikat!' };
    }

    if (targetQuest.status === 'claimed') {
      return { success: false, message: 'Sayembara ini sudah selesai dan hadiah telah diambil.' };
    }

    // Set other active quests back to available if not completed
    this.quests.forEach(q => {
      if (q.id !== questId && q.status === 'active') {
        q.status = 'available';
      }
    });

    if (targetQuest.status === 'available') {
      targetQuest.status = 'active';
    }

    this.notifyUpdate();
    return {
      success: true,
      message: `Sayembara "${targetQuest.title}" resmi diterima!`,
      quest: targetQuest
    };
  }

  /**
   * Updates objective progress for active quests matching targetType
   */
  public updateProgress(targetType: string, amount = 1): { completed: boolean; quest?: GuildQuest } {
    const activeQuest = this.getActiveQuest();
    if (!activeQuest || activeQuest.status !== 'active') {
      return { completed: false };
    }

    if (activeQuest.targetType === targetType) {
      activeQuest.currentCount = Math.min(activeQuest.targetCount, activeQuest.currentCount + amount);
      activeQuest.currentProgress = activeQuest.currentCount;

      if (activeQuest.currentCount >= activeQuest.targetCount) {
        activeQuest.status = 'completed';
        this.notifyUpdate();
        this.onQuestComplete?.(activeQuest);
        return { completed: true, quest: activeQuest };
      }

      this.notifyUpdate();
      return { completed: false, quest: activeQuest };
    }

    return { completed: false };
  }

  public claimReward(questId: string): {
    success: boolean;
    score: number;
    itemName?: string;
    itemIcon?: string;
    itemQty?: number;
    message: string;
  } {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest) {
      return { success: false, score: 0, message: 'Sayembara tidak valid.' };
    }

    if (quest.status !== 'completed') {
      return { success: false, score: 0, message: 'Sayembara belum tuntas diselesaikan!' };
    }

    quest.status = 'claimed';
    this.notifyUpdate();

    return {
      success: true,
      score: quest.rewardScore,
      itemName: quest.rewardItemName,
      itemIcon: quest.rewardItemIcon,
      itemQty: quest.rewardItemQty,
      message: `Selamat! Hadiah Sayembara "${quest.title}" berhasil diklaim (+${quest.rewardScore} Skor)!`
    };
  }

  private notifyUpdate(): void {
    this.onQuestsUpdate?.(this.getQuests());
    this.onActiveQuestChange?.(this.getActiveQuest());
  }
}
