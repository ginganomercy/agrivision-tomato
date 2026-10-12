/**
 * MonsterManager - Agricultural Pest Monster Entity & Combat Quest System
 * Features:
 * 1. 5 Interactive Cartoon Pest Monsters (Tomato Hornworms & Blight Beetles)
 * 2. Animated idle, patrol locomotion, and hit flinch/knockback behaviors
 * 3. Overhead floating 3D health bars
 * 4. Spin attack & stomp jump hit detection with visual star burst particles
 * 5. Bounty Quest tracking ("Basmi 5 Hama Penggerek Kebun") with rewards & fanfare
 */
import * as THREE from 'three';
import { BotanicalMeadow } from './BotanicalMeadow';

export type MonsterType = 'hornworm' | 'beetle';

export interface MonsterEntity {
  id: number;
  name: string;
  type: MonsterType;
  group: THREE.Group;
  baseX: number;
  baseZ: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  hp: number;
  maxHp: number;
  isDefeated: boolean;
  patrolAngle: number;
  patrolSpeed: number;
  patrolRadius: number;
  flinchTimer: number;
  bodyMeshGroup: THREE.Group;
  hpBarFill: THREE.Mesh;
  hpBarGroup: THREE.Group;
}

export interface AttackResult {
  hit: boolean;
  defeated: boolean;
  monsterName: string;
  scoreGained: number;
  hitPosition: THREE.Vector3;
}

export class MonsterManager {
  private group: THREE.Group;
  private monsters: MonsterEntity[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // Hit burst particle system
  private hitParticlesGroup: THREE.Group;
  private hitParticlePoints: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];

  // Quest State
  public static readonly TARGET_COUNT = 5;
  private defeatedCount: number = 0;
  private isQuestCompleted: boolean = false;

  // Callbacks
  public onQuestUpdate?: (defeated: number, total: number) => void;
  public onQuestComplete?: (rewardScore: number) => void;

  constructor() {
    this.group = new THREE.Group();
    this.hitParticlesGroup = new THREE.Group();
    this.group.add(this.hitParticlesGroup);

    this.spawnPestMonsters();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  public getQuestStatus(): { defeated: number; total: number; completed: boolean } {
    return {
      defeated: this.defeatedCount,
      total: MonsterManager.TARGET_COUNT,
      completed: this.isQuestCompleted
    };
  }

  private spawnPestMonsters(): void {
    // 5 Agricultural Pests invading crop sectors
    const spawnData = [
      { id: 1, name: 'Ulat Tanduk Daun A', type: 'hornworm' as MonsterType, x: 26, z: -22, radius: 4.2, speed: 0.6 },
      { id: 2, name: 'Ulat Tanduk Daun B', type: 'hornworm' as MonsterType, x: 38, z: -32, radius: 4.8, speed: 0.55 },
      { id: 3, name: 'Ulat Tanduk Nakal', type: 'hornworm' as MonsterType, x: -8, z: 9, radius: 3.5, speed: 0.7 },
      { id: 4, name: 'Kumbang Spora Ungu', type: 'beetle' as MonsterType, x: 24, z: 24, radius: 4.5, speed: 0.8 },
      { id: 5, name: 'Kumbang Penggerek', type: 'beetle' as MonsterType, x: -22, z: -24, radius: 4.0, speed: 0.75 }
    ];

    spawnData.forEach(data => {
      const monsterGroup = new THREE.Group();
      const initialY = BotanicalMeadow.getSurfaceElevation(data.x, data.z);
      monsterGroup.position.set(data.x, initialY, data.z);

      const bodyGroup = new THREE.Group();
      monsterGroup.add(bodyGroup);

      if (data.type === 'hornworm') {
        this.buildHornwormMesh(bodyGroup);
      } else {
        this.buildBeetleMesh(bodyGroup);
      }

      // Overhead Floating 3D HP Bar
      const { hpBarGroup, hpBarFill } = this.createOverheadHpBar();
      hpBarGroup.position.set(0, data.type === 'hornworm' ? 1.3 : 1.5, 0);
      monsterGroup.add(hpBarGroup);

      this.group.add(monsterGroup);

      this.monsters.push({
        id: data.id,
        name: data.name,
        type: data.type,
        group: monsterGroup,
        baseX: data.x,
        baseZ: data.z,
        position: monsterGroup.position,
        velocity: new THREE.Vector3(0, 0, 0),
        hp: 2,
        maxHp: 2,
        isDefeated: false,
        patrolAngle: Math.random() * Math.PI * 2,
        patrolSpeed: data.speed,
        patrolRadius: data.radius,
        flinchTimer: 0,
        bodyMeshGroup: bodyGroup,
        hpBarFill,
        hpBarGroup
      });
    });
  }

  /**
   * Constructs cute segmented Hornworm Caterpillar 3D Model
   */
  private buildHornwormMesh(parent: THREE.Group): void {
    const wormMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.5 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0x8bc34a, roughness: 0.6 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.4 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
    this.disposables.push(wormMat, bellyMat, hornMat, eyeMat, pupilMat);

    // 4 Body segments
    const segmentRadii = [0.38, 0.44, 0.42, 0.35]; // Tail to Head
    segmentRadii.forEach((r, idx) => {
      const segMesh = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), wormMat);
      segMesh.position.set(0, r * 0.9, (idx - 1.5) * 0.55);
      segMesh.scale.set(1.0, 0.85, 1.1);
      segMesh.castShadow = true;
      parent.add(segMesh);

      // Belly stripe
      const belly = new THREE.Mesh(new THREE.SphereGeometry(r * 0.7, 6, 6), bellyMat);
      belly.position.set(0, r * 0.5, (idx - 1.5) * 0.55);
      parent.add(belly);
    });

    // Red Horn on Tail (Segment 0)
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), hornMat);
    horn.position.set(0, 0.72, -1.1);
    horn.rotation.x = -0.55;
    parent.add(horn);

    // Cartoon Eyes on Head (Segment 3)
    [-0.18, 0.18].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
      eye.position.set(ex, 0.55, 0.95);
      parent.add(eye);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), pupilMat);
      pupil.position.set(ex, 0.55, 1.05);
      parent.add(pupil);
    });

    // Leafy Antennae
    [-0.15, 0.15].forEach(ax => {
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.25, 4), bellyMat);
      antenna.position.set(ax, 0.75, 0.75);
      antenna.rotation.z = ax > 0 ? -0.4 : 0.4;
      parent.add(antenna);
    });
  }

  /**
   * Constructs faceted Blight Beetle 3D Model
   */
  private buildBeetleMesh(parent: THREE.Group): void {
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x6a1b9a, roughness: 0.35, metalness: 0.3 });
    const spotMat = new THREE.MeshStandardMaterial({ color: 0xff9800, roughness: 0.4 });
    const underMat = new THREE.MeshStandardMaterial({ color: 0x2e153b, roughness: 0.7 });
    const pincerMat = new THREE.MeshStandardMaterial({ color: 0xffb300, metalness: 0.6, roughness: 0.3 });
    this.disposables.push(shellMat, spotMat, underMat, pincerMat);

    // Carapace Shell Dome
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), shellMat);
    shell.position.set(0, 0.5, 0);
    shell.scale.set(0.9, 0.7, 1.2);
    shell.castShadow = true;
    parent.add(shell);

    // Glowing Blight Spots on Shell
    [[-0.25, 0.7, -0.2], [0.25, 0.7, -0.2], [-0.3, 0.65, 0.2], [0.3, 0.65, 0.2]].forEach(([sx, sy, sz]) => {
      const spot = new THREE.Mesh(new THREE.CircleGeometry(0.12, 6), spotMat);
      spot.position.set(sx, sy, sz);
      spot.rotation.x = -Math.PI / 2;
      parent.add(spot);
    });

    // Pincers on Front
    [-0.22, 0.22].forEach(px => {
      const pincer = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 5), pincerMat);
      pincer.position.set(px, 0.4, 0.75);
      pincer.rotation.x = Math.PI / 2;
      pincer.rotation.z = px > 0 ? -0.4 : 0.4;
      parent.add(pincer);
    });

    // 6 Scuttling Legs
    [-0.45, 0.45].forEach(lx => {
      [-0.3, 0, 0.3].forEach(lz => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.06), underMat);
        leg.position.set(lx, 0.2, lz);
        leg.rotation.z = lx > 0 ? -0.4 : 0.4;
        parent.add(leg);
      });
    });
  }

  /**
   * Constructs 3D Floating Health Bar
   */
  private createOverheadHpBar(): { hpBarGroup: THREE.Group; hpBarFill: THREE.Mesh } {
    const hpBarGroup = new THREE.Group();

    // Background border frame (dark grey)
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.16), bgMat);
    this.disposables.push(bgMat);
    hpBarGroup.add(bgMesh);

    // Health Fill Bar (starts green)
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x4caf50 });
    const fillGeo = new THREE.PlaneGeometry(0.80, 0.12);
    fillGeo.translate(0.40, 0, 0); // Left align pivot
    this.disposables.push(fillMat, fillGeo);

    const hpBarFill = new THREE.Mesh(fillGeo, fillMat);
    hpBarFill.position.set(-0.40, 0, 0.01);
    hpBarGroup.add(hpBarFill);

    return { hpBarGroup, hpBarFill };
  }

  /**
   * Evaluates combat attacks from the player against all living monsters
   */
  public checkAttackHit(
    playerPos: THREE.Vector3,
    isSpinning: boolean,
    isJumping: boolean,
    isBoosting: boolean
  ): AttackResult | null {
    // Attack radius: Spin attack has wide reach (2.6m), stomp jump/tackle has 1.8m
    const attackRange = isSpinning ? 2.6 : (isJumping || isBoosting ? 1.85 : 0);
    if (attackRange <= 0) return null;

    for (let i = 0; i < this.monsters.length; i++) {
      const monster = this.monsters[i];
      if (monster.isDefeated) continue;

      const dist = Math.hypot(playerPos.x - monster.position.x, playerPos.z - monster.position.z);
      if (dist < attackRange) {
        // Monster hit!
        monster.hp -= 1;
        monster.flinchTimer = 0.35;

        // Apply knockback away from player
        const knockDirX = (monster.position.x - playerPos.x) / (dist || 1);
        const knockDirZ = (monster.position.z - playerPos.z) / (dist || 1);
        monster.velocity.set(knockDirX * 6.5, 3.2, knockDirZ * 6.5);

        // Spawn hit star burst particles
        this.spawnHitBurst(monster.position);

        // Update HP Bar
        const hpPct = Math.max(0, monster.hp / monster.maxHp);
        monster.hpBarFill.scale.set(hpPct, 1, 1);
        (monster.hpBarFill.material as THREE.MeshBasicMaterial).color.setHex(hpPct > 0.5 ? 0x4caf50 : 0xf44336);

        let defeated = false;
        let scoreGained = 50;

        if (monster.hp <= 0) {
          monster.isDefeated = true;
          monster.hpBarGroup.visible = false;
          defeated = true;
          scoreGained = 150;
          this.defeatedCount += 1;

          if (this.onQuestUpdate) {
            this.onQuestUpdate(this.defeatedCount, MonsterManager.TARGET_COUNT);
          }

          if (this.defeatedCount >= MonsterManager.TARGET_COUNT && !this.isQuestCompleted) {
            this.isQuestCompleted = true;
            if (this.onQuestComplete) {
              this.onQuestComplete(500); // 500 bonus points
            }
          }
        }

        return {
          hit: true,
          defeated,
          monsterName: monster.name,
          scoreGained,
          hitPosition: monster.position.clone()
        };
      }
    }

    return null;
  }

  /**
   * Spawns cartoon star burst particles upon hitting a monster
   */
  private spawnHitBurst(pos: THREE.Vector3): void {
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    const starGeo = new THREE.CircleGeometry(0.14, 5);
    this.disposables.push(starMat, starGeo);

    for (let p = 0; p < 6; p++) {
      const pMesh = new THREE.Mesh(starGeo, starMat);
      pMesh.position.copy(pos);
      pMesh.position.y += 0.8;
      this.hitParticlesGroup.add(pMesh);

      const angle = (p / 6) * Math.PI * 2;
      const speed = 2.5 + Math.random() * 2.0;
      this.hitParticlePoints.push({
        mesh: pMesh,
        vel: new THREE.Vector3(Math.cos(angle) * speed, 2.0 + Math.random() * 2.0, Math.sin(angle) * speed),
        life: 0.35
      });
    }
  }

  /**
   * Frame update for monster patrol locomotion, physics, and animations
   */
  public update(deltaTime: number, elapsedTime: number, camera: THREE.Camera): void {
    const dt = Math.min(deltaTime, 0.1);

    // 1. Update Monster Entities
    this.monsters.forEach(m => {
      // Keep overhead HP bar facing active camera
      if (!m.isDefeated) {
        m.hpBarGroup.quaternion.copy(camera.quaternion);
      }

      if (m.isDefeated) {
        // Shrink away smoothly after defeat
        if (m.group.scale.x > 0.05) {
          m.group.scale.multiplyScalar(0.92);
        } else {
          m.group.visible = false;
        }
        return;
      }

      // Knockback physics
      if (m.velocity.lengthSq() > 0.01) {
        m.position.x += m.velocity.x * dt;
        m.position.y += m.velocity.y * dt;
        m.position.z += m.velocity.z * dt;

        m.velocity.x *= 0.85;
        m.velocity.z *= 0.85;
        m.velocity.y -= 18.0 * dt; // Gravity
      } else {
        // Normal patrol locomotion
        m.patrolAngle += m.patrolSpeed * dt;
        const targetX = m.baseX + Math.cos(m.patrolAngle) * m.patrolRadius;
        const targetZ = m.baseZ + Math.sin(m.patrolAngle) * m.patrolRadius;

        m.position.x += (targetX - m.position.x) * dt * 2.5;
        m.position.z += (targetZ - m.position.z) * dt * 2.5;

        // Face movement direction
        const moveDir = Math.atan2(Math.cos(m.patrolAngle), -Math.sin(m.patrolAngle));
        m.group.rotation.y = moveDir;

        // Wiggle / crawl locomotion animation
        if (m.type === 'hornworm') {
          const wiggle = Math.sin(elapsedTime * 6.0 + m.id) * 0.12;
          m.bodyMeshGroup.rotation.y = wiggle;
          m.bodyMeshGroup.scale.z = 1.0 + Math.sin(elapsedTime * 8.0) * 0.1;
        } else {
          // Beetle hopping scuttle
          const hop = Math.abs(Math.sin(elapsedTime * 8.0 + m.id)) * 0.15;
          m.bodyMeshGroup.position.y = hop;
        }
      }

      // Conform to solid surface elevation
      const surfaceY = BotanicalMeadow.getSurfaceElevation(m.position.x, m.position.z);
      if (m.position.y < surfaceY) {
        m.position.y = surfaceY;
        m.velocity.y = 0;
      }

      // Flinch flash animation
      if (m.flinchTimer > 0) {
        m.flinchTimer -= dt;
        m.bodyMeshGroup.scale.set(1.15, 0.85, 1.15); // Squish from hit
      } else {
        m.bodyMeshGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
      }
    });

    // 2. Update Hit Burst Particles
    for (let p = this.hitParticlePoints.length - 1; p >= 0; p--) {
      const part = this.hitParticlePoints[p];
      part.life -= dt;
      part.mesh.position.addScaledVector(part.vel, dt);
      part.vel.y -= 12.0 * dt;
      part.mesh.scale.multiplyScalar(0.94);

      if (part.life <= 0) {
        this.hitParticlesGroup.remove(part.mesh);
        this.hitParticlePoints.splice(p, 1);
      }
    }
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.monsters = [];
    this.hitParticlePoints = [];
  }
}
