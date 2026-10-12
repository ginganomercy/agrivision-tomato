/**
 * NPCManager - Horticultural Guild NPCs & Interactive RPG Dialogue System
 * Manages 3D models, procedural kinematics, spatial lookAt tracking, and dialogue trees for:
 * 1. 🍇 Sir Grapes - The Traveling Swashbuckler (Combat tips & vineyard rumors)
 * 2. 🍍 Captain Pineapple - The Agri-Guild Master (Bounties & guild honors)
 * 3. 🍓 Madam Strawberry - The Tavern Keeper (Restoration drinks & harvest lore)
 */
import * as THREE from 'three';
import type { DialogueNode, InteractableTarget } from '../types';

export interface NPCEntity {
  id: string;
  name: string;
  title: string;
  icon: string;
  group: THREE.Group;
  worldPos: THREE.Vector3;
  baseY: number;
  rootDialogueId: string;
  lookAtPlayer: boolean;
}

export class NPCManager {
  private group: THREE.Group;
  private npcs: NPCEntity[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // Bounty Board spatial interaction anchor (Center: x = -14.0, z = 9.4 in tavern)
  public static readonly BOUNTY_BOARD_POS = new THREE.Vector3(-14.0, -39.16, 9.4);

  // Dialog Tree Database
  private dialogueDatabase: Map<string, DialogueNode> = new Map();

  constructor() {
    this.group = new THREE.Group();

    this.initDialogueDatabase();
    this.buildSirGrapes();
    this.buildCaptainPineapple();
    this.buildMadamStrawberry();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  public getDialogue(id: string): DialogueNode | undefined {
    return this.dialogueDatabase.get(id);
  }

  public getDialogueNode(id: string): DialogueNode | null {
    return this.dialogueDatabase.get(id) || null;
  }

  public getInitialDialogue(npcId: string): DialogueNode | null {
    const npc = this.npcs.find(n => n.id === npcId);
    if (!npc) return null;
    return this.dialogueDatabase.get(npc.rootDialogueId) || null;
  }

  private initDialogueDatabase(): void {
    // 🍇 Sir Grapes Dialogues
    this.dialogueDatabase.set('grapes_intro', {
      id: 'grapes_intro',
      speaker: 'Sir Grapes',
      speakerTitle: 'Ksatria Anggur Pengembara',
      speakerIcon: '🍇',
      text: 'Salam, kawan tomat pemberani! Udara di kedai ini sungguh nikmat setelah seharian berpatroli di kebun anggur. Ada yang ingin kau tanyakan?',
      options: [
        { text: 'Bagaimana cara melawan kumbang dengan efektif?', nextDialogueId: 'grapes_combat_tip' },
        { text: 'Di mana aku bisa mengambil sayembara kebun?', nextDialogueId: 'grapes_quest_guide' },
        { text: 'Hanya menyapa, sampai jumpa!', action: 'close' }
      ]
    });

    this.dialogueDatabase.set('grapes_combat_tip', {
      id: 'grapes_combat_tip',
      speaker: 'Sir Grapes',
      speakerTitle: 'Ksatria Anggur Pengembara',
      speakerIcon: '🍇',
      text: 'Karapas kumbang hawar sangat keras, kawan! Jangan serang secara sembarangan. Gunakan Tebasan Pedang [F] setelah melompat, atau gunakan serangan putaran [Spasi/Tombol Spin] untuk memecah pertahanan mereka!',
      options: [
        { text: 'Luar biasa! Terima kasih atas ilmunya, Sir Grapes!', action: 'close' }
      ]
    });

    this.dialogueDatabase.set('grapes_quest_guide', {
      id: 'grapes_quest_guide',
      speaker: 'Sir Grapes',
      speakerTitle: 'Ksatria Anggur Pengembara',
      speakerIcon: '🍇',
      text: 'Lihatlah ke panggung kehormatan di sisi utara! Captain Pineapple sedang menjaga Papan Sayembara Serikat Tani. Bicaralah dengannya atau buka papan perkamen itu!',
      options: [
        { text: 'Buka Papan Sayembara Sekarang 📜', action: 'open_quest_board' },
        { text: 'Baik, aku akan menemuinya.', action: 'close' }
      ]
    });

    // 🍍 Captain Pineapple Dialogues
    this.dialogueDatabase.set('pineapple_intro', {
      id: 'pineapple_intro',
      speaker: 'Captain Pineapple',
      speakerTitle: 'Ketua Serikat Tani (Guild Master)',
      speakerIcon: '🍍',
      text: 'Hahaha! Selamat datang di markas besar Serikat Tani Agrivision! Aku Captain Pineapple. Kamu terlihat gesit dan pedang daunmu berkilau tajam. Siap menerima tugas mulia?',
      options: [
        { text: '📜 Saya ingin melihat papan sayembara!', action: 'open_quest_board' },
        { text: 'Apa itu Serikat Tani Agrivision?', nextDialogueId: 'pineapple_lore' },
        { text: 'Nanti saya kembali lagi, Kapten.', action: 'close' }
      ]
    });

    this.dialogueDatabase.set('pineapple_lore', {
      id: 'pineapple_lore',
      speaker: 'Captain Pineapple',
      speakerTitle: 'Ketua Serikat Tani (Guild Master)',
      speakerIcon: '🍍',
      text: 'Kami adalah persaudaraan penjaga tanaman holtikultura! Tugas kami membasmi hama ulat dan kumbang, mengumpulkan energi embun emas, dan meneliti kultivar tomat tahan penyakit.',
      options: [
        { text: 'Buka Papan Sayembara, saya ingin membantu!', action: 'open_quest_board' },
        { text: 'Siap laksanakan, Kapten!', action: 'close' }
      ]
    });

    // 🍓 Madam Strawberry Dialogues
    this.dialogueDatabase.set('strawberry_intro', {
      id: 'strawberry_intro',
      speaker: 'Madam Strawberry',
      speakerTitle: 'Barista & Herbalis Kedai',
      speakerIcon: '🍓',
      text: 'Hai manis! Selamat datang di bar kedai Serikat Tani. Mau segelas jus sari apel dingin atau ramuan herbal hangat untuk memulihkan stamina?',
      options: [
        { text: 'Bolehkah saya minta penambah kecepatan lari?', nextDialogueId: 'strawberry_buff' },
        { text: 'Ceritakan tentang kedai ini, Madam!', nextDialogueId: 'strawberry_tavern_story' },
        { text: 'Hanya melihat-lihat, terima kasih!', action: 'close' }
      ]
    });

    this.dialogueDatabase.set('strawberry_buff', {
      id: 'strawberry_buff',
      speaker: 'Madam Strawberry',
      speakerTitle: 'Barista & Herbalis Kedai',
      speakerIcon: '🍓',
      text: 'Tentu saja, pahlawan kecil! Minumlah Sari Nektar Stroberi Manis ini... *Syuuung!* Larimu kini bertambah kencang dan gesit!',
      options: [
        { text: 'Terima kasih banyak, Madam Strawberry!', action: 'give_speed_buff' }
      ]
    });

    this.dialogueDatabase.set('strawberry_tavern_story', {
      id: 'strawberry_tavern_story',
      speaker: 'Madam Strawberry',
      speakerTitle: 'Barista & Herbalis Kedai',
      speakerIcon: '🍓',
      text: 'Kedai ini dibangun berabad-abad lalu dari kayu ek tua kebun botani. Di sinilah para pejuang kebun berkumpul merayakan panen raya setelah seharian menjaga tanaman dari hama.',
      options: [
        { text: 'Tempat yang sangat hangat dan indah!', action: 'close' }
      ]
    });
  }

  /**
   * 1. 🍇 Builds Sir Grapes (Cluster of glossy purple grapes, cavalier hat, rapier)
   * Located sitting near the center banquet table (x = -1.8, y = -39.16, z = 16.5)
   */
  private buildSirGrapes(): void {
    const grapesGroup = new THREE.Group();
    const worldPos = new THREE.Vector3(-11.8, -39.16, 17.0);
    grapesGroup.position.copy(worldPos);

    const grapeMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      roughness: 0.25,
      metalness: 0.1
    });
    const grapeDarkMat = new THREE.MeshStandardMaterial({
      color: 0x5b21b6,
      roughness: 0.3
    });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.8 });
    const featherMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const rapierMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });

    this.disposables.push(grapeMat, grapeDarkMat, stemMat, hatMat, featherMat, eyeWhiteMat, eyePupilMat, rapierMat);

    // Grape cluster spheres (forming body and head)
    const grapeOffsets: [number, number, number, number][] = [
      [0, 0.45, 0, 0.22],       // Center lower
      [-0.18, 0.52, 0.05, 0.2], // Left lower
      [0.18, 0.52, 0.05, 0.2],  // Right lower
      [0, 0.55, -0.16, 0.19],   // Back lower
      [-0.12, 0.75, 0, 0.23],   // Left mid
      [0.12, 0.75, 0, 0.23],    // Right mid
      [0, 0.78, 0.15, 0.22],    // Front mid (belly)
      [0, 0.76, -0.14, 0.2],    // Back mid
      [0, 0.98, 0.04, 0.25],    // Head central grape
      [-0.15, 0.96, -0.05, 0.18],// Left top
      [0.15, 0.96, -0.05, 0.18]  // Right top
    ];

    grapeOffsets.forEach(([gx, gy, gz, gr], idx) => {
      const gSphere = new THREE.Mesh(
        new THREE.SphereGeometry(gr, 10, 8),
        idx % 2 === 0 ? grapeMat : grapeDarkMat
      );
      gSphere.position.set(gx, gy, gz);
      gSphere.castShadow = true;
      grapesGroup.add(gSphere);
    });

    // Cute cartoon eyes on head grape
    [-0.08, 0.08].forEach(ex => {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), eyeWhiteMat);
      white.position.set(ex, 1.02, 0.26);
      grapesGroup.add(white);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyePupilMat);
      pupil.position.set(ex, 1.02, 0.31);
      grapesGroup.add(pupil);
    });

    // Stem on head
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 6), stemMat);
    stem.position.set(0, 1.25, 0);
    grapesGroup.add(stem);

    // Cavalier Feathered Hat
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 12), hatMat);
    hatBrim.position.set(0, 1.22, 0);
    hatBrim.rotation.z = -0.15;
    grapesGroup.add(hatBrim);

    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.2, 10), hatMat);
    hatCrown.position.set(0, 1.32, 0);
    hatCrown.rotation.z = -0.15;
    grapesGroup.add(hatCrown);

    // Green emerald feather
    const feather = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 5), featherMat);
    feather.position.set(0.18, 1.42, 0);
    feather.rotation.z = -0.65;
    grapesGroup.add(feather);

    // Sheathed Rapier Sword on hip
    const rapier = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.7, 6), rapierMat);
    rapier.position.set(0.3, 0.45, -0.1);
    rapier.rotation.x = 0.55;
    rapier.rotation.z = -0.3;
    grapesGroup.add(rapier);

    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 8), hatMat);
    guard.position.set(0.3, 0.65, -0.22);
    grapesGroup.add(guard);

    this.group.add(grapesGroup);

    this.npcs.push({
      id: 'sir_grapes',
      name: 'Sir Grapes',
      title: 'Ksatria Anggur Pengembara',
      icon: '🍇',
      group: grapesGroup,
      worldPos: worldPos,
      baseY: worldPos.y,
      rootDialogueId: 'grapes_intro',
      lookAtPlayer: true
    });
  }

  /**
   * 2. 🍍 Builds Captain Pineapple (Diamond-scaled body, leaf crown, brass monocle, sash)
   * Located at the Guild Dais (x = -10.5, y = -39.16, z = 10.6)
   */
  private buildCaptainPineapple(): void {
    const pineappleGroup = new THREE.Group();
    const worldPos = new THREE.Vector3(-11.8, -38.88, 10.8);
    pineappleGroup.position.copy(worldPos);

    const pineMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.45,
      metalness: 0.1
    });
    const pineCrownMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.65
    });
    const sashMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Royal Guild Crimson
      roughness: 0.5
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    this.disposables.push(pineMat, pineCrownMat, sashMat, brassMat, eyeWhiteMat, eyePupilMat);

    // Main Oval Pineapple Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 1.15, 12), pineMat);
    body.position.set(0, 0.65, 0);
    body.castShadow = true;
    pineappleGroup.add(body);

    // Spiky Pineapple Leaf Crown (10 layered spiky leaves)
    for (let l = 0; l < 8; l++) {
      const ang = (l * Math.PI) / 4;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 5), pineCrownMat);
      leaf.position.set(Math.cos(ang) * 0.16, 1.35, Math.sin(ang) * 0.16);
      leaf.rotation.x = Math.sin(ang) * 0.35;
      leaf.rotation.z = -Math.cos(ang) * 0.35;
      pineappleGroup.add(leaf);
    }
    // Tall central leaf
    const topLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.75, 5), pineCrownMat);
    topLeaf.position.set(0, 1.5, 0);
    pineappleGroup.add(topLeaf);

    // Captain Eyes & Mustache
    [-0.14, 0.14].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), eyeWhiteMat);
      eye.position.set(ex, 0.82, 0.34);
      pineappleGroup.add(eye);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyePupilMat);
      pupil.position.set(ex, 0.82, 0.4);
      pineappleGroup.add(pupil);
    });

    // Veteran Brass Monocle on right eye!
    const monocle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 12), brassMat);
    monocle.position.set(0.14, 0.82, 0.41);
    pineappleGroup.add(monocle);

    const monocleChain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.35, 4), brassMat);
    monocleChain.position.set(0.24, 0.65, 0.35);
    monocleChain.rotation.z = -0.4;
    pineappleGroup.add(monocleChain);

    // Captain's Veteran Sash across body
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.85), sashMat);
    sash.position.set(0, 0.58, 0);
    sash.rotation.y = Math.PI / 4;
    sash.rotation.z = 0.5;
    pineappleGroup.add(sash);

    // Brass Guild Master Star Badge
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 6), brassMat);
    badge.position.set(-0.2, 0.72, 0.32);
    badge.rotation.x = Math.PI / 2;
    pineappleGroup.add(badge);

    this.group.add(pineappleGroup);

    this.npcs.push({
      id: 'captain_pineapple',
      name: 'Captain Pineapple',
      title: 'Ketua Serikat Tani (Guild Master)',
      icon: '🍍',
      group: pineappleGroup,
      worldPos: worldPos,
      baseY: worldPos.y,
      rootDialogueId: 'pineapple_intro',
      lookAtPlayer: true
    });
  }

  /**
   * 3. 🍓 Builds Madam Strawberry (Tapered seed cone, daisy flower hairpin, white apron)
   * Located behind the bar counter (x = -23.2, y = -39.16, z = 18.0)
   */
  private buildMadamStrawberry(): void {
    const strawGroup = new THREE.Group();
    const worldPos = new THREE.Vector3(-23.2, -39.16, 18.0);
    strawGroup.position.copy(worldPos);

    const strawMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Sweet ruby strawberry red
      roughness: 0.3,
      metalness: 0.05
    });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x1c1917 });

    this.disposables.push(strawMat, leafMat, apronMat, flowerMat, eyeWhiteMat, eyePupilMat);

    // Tapered Strawberry Body (Wider top, tapered bottom)
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.05, 12), strawMat);
    body.position.set(0, 0.62, 0);
    body.rotation.x = Math.PI; // Taper points down!
    body.castShadow = true;
    strawGroup.add(body);

    // Green Calyx Leaves on Head
    for (let c = 0; c < 5; c++) {
      const ang = (c * Math.PI * 2) / 5;
      const calyx = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 4), leafMat);
      calyx.position.set(Math.cos(ang) * 0.22, 1.15, Math.sin(ang) * 0.22);
      calyx.rotation.x = Math.sin(ang) * 0.5;
      calyx.rotation.z = -Math.cos(ang) * 0.5;
      strawGroup.add(calyx);
    }

    // Stem & Daisy Flower Hairpin
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.2, 6), leafMat);
    stem.position.set(0, 1.25, 0);
    strawGroup.add(stem);

    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), flowerMat);
    flower.position.set(0.18, 1.22, 0.15);
    strawGroup.add(flower);

    // Cute smiling eyes & blush cheeks
    [-0.12, 0.12].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeWhiteMat);
      eye.position.set(ex, 0.85, 0.32);
      strawGroup.add(eye);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyePupilMat);
      pupil.position.set(ex, 0.85, 0.38);
      strawGroup.add(pupil);
    });

    // White Barista Apron on Front
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.1), apronMat);
    apron.position.set(0, 0.45, 0.25);
    strawGroup.add(apron);

    this.group.add(strawGroup);

    this.npcs.push({
      id: 'madam_strawberry',
      name: 'Madam Strawberry',
      title: 'Barista & Herbalis Kedai',
      icon: '🍓',
      group: strawGroup,
      worldPos: worldPos,
      baseY: worldPos.y,
      rootDialogueId: 'strawberry_intro',
      lookAtPlayer: true
    });
  }

  /**
   * Updates procedural animation for NPCs:
   * 1. Idle breathing bob
   * 2. Smooth yaw rotation to look at player when nearby (< 4.5m)
   */
  public update(deltaTime: number, playerPos: THREE.Vector3): void {
    const time = Date.now() * 0.0025;

    this.npcs.forEach((npc, idx) => {
      // 1. Subtle idle breathing bob
      const bob = Math.sin(time + idx * 1.5) * 0.025;
      npc.group.position.y = npc.baseY + bob;

      // 2. Look-At Player when player approaches
      const dist = playerPos.distanceTo(npc.worldPos);
      if (dist <= 4.8 && npc.lookAtPlayer) {
        // Target angle towards player
        const dx = playerPos.x - npc.worldPos.x;
        const dz = playerPos.z - npc.worldPos.z;
        const targetYaw = Math.atan2(dx, dz);

        // Smooth rotation interpolation
        npc.group.rotation.y = THREE.MathUtils.lerp(
          npc.group.rotation.y,
          targetYaw,
          Math.min(1.0, deltaTime * 5.0)
        );
      } else {
        // Return to neutral forward orientation
        npc.group.rotation.y = THREE.MathUtils.lerp(
          npc.group.rotation.y,
          0,
          Math.min(1.0, deltaTime * 2.0)
        );
      }
    });
  }

  /**
   * Evaluates if player is standing near an interactable NPC or the Bounty Board
   */
  public checkInteractable(playerPos: THREE.Vector3): InteractableTarget | null {
    // 1. Check Proximity to Bounty Board (x = -14.0, z = 9.4 in world)
    const distToBoard = Math.hypot(
      playerPos.x - NPCManager.BOUNTY_BOARD_POS.x,
      playerPos.z - NPCManager.BOUNTY_BOARD_POS.z
    );
    if (distToBoard <= 3.2 && playerPos.y < -35.0) {
      return {
        id: 'guild_bounty_board',
        name: 'Papan Sayembara Serikat Tani',
        promptText: 'Tekan [E] untuk Memilih Sayembara',
        icon: '📜',
        type: 'bounty_board'
      };
    }

    // 2. Check Proximity to NPCs
    for (const npc of this.npcs) {
      const dist = Math.hypot(
        playerPos.x - npc.worldPos.x,
        playerPos.z - npc.worldPos.z
      );
      if (dist <= 2.6 && playerPos.y < -35.0) {
        return {
          id: npc.id,
          name: npc.name,
          promptText: `Tekan [E] untuk Bicara dengan ${npc.name}`,
          icon: npc.icon,
          type: 'npc'
        };
      }
    }

    return null;
  }

  public getNPCById(id: string): NPCEntity | undefined {
    return this.npcs.find(n => n.id === id);
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.npcs = [];
  }
}
