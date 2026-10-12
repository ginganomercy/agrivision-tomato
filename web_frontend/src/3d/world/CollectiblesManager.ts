/**
 * CollectiblesManager - Golden Heirloom Tomatoes & Agricultural Energy Seeds
 * Spawns interactive reward items across both the Greenhouse Laboratory and Open Meadow.
 * Handles bobbing physics, rotation, and distance-based collection triggers.
 */
import * as THREE from 'three';
import type { CollectibleItem } from '../types';

export class CollectiblesManager {
  private group: THREE.Group;
  private items: CollectibleItem[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.spawnCollectibles();
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  public getItems(): CollectibleItem[] {
    return this.items;
  }

  public getActivePositions(): { x: number; z: number; points: number }[] {
    return this.items
      .filter(item => item.active)
      .map(item => ({ x: item.position.x, z: item.position.z, points: item.points }));
  }

  private spawnCollectibles(): void {
    // Shared gold physical material
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xffb703, // Rich warm amber gold
      metalness: 0.35,
      roughness: 0.25,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });

    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfff3b0,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });

    const sepalMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.5 });
    this.disposables.push(goldMat, haloMat, sepalMat);

    // 22 Strategic reward locations distributed across all 5 thematic zones
    const spawnPoints: { x: number; z: number; y: number; points: number }[] = [
      // Zone 1: Ruang Laboratorium Greenhouse
      { x: 0, z: -3.5, y: 0.95, points: 100 },
      { x: -3.5, z: 0, y: 0.95, points: 100 },
      { x: 3.5, z: 0, y: 0.95, points: 100 },
      { x: 0, z: 4.5, y: 0.95, points: 150 },
      // Zone 2: Kebun Tomat Komersial (Trellis Rows)
      { x: 26.0, z: -25.0, y: 0.85, points: 200 },
      { x: 35.0, z: -32.0, y: 0.85, points: 200 },
      { x: 44.0, z: -28.0, y: 0.85, points: 250 },
      { x: 35.0, z: -42.0, y: 0.85, points: 250 },
      // Zone 3: Taman Bunga & Polinator Sanctuary
      { x: -28.0, z: -28.0, y: 0.85, points: 200 },
      { x: -38.0, z: -35.0, y: 0.85, points: 250 },
      { x: -44.0, z: -42.0, y: 0.85, points: 250 },
      { x: -30.0, z: -45.0, y: 0.85, points: 300 },
      // Zone 4: Danau Irigasi Botani & Dermaga Kayu
      { x: -35.0, z: 23.0, y: 0.85, points: 350 },
      { x: -35.0, z: 27.0, y: 0.85, points: 500 }, // Ujung dermaga (Grand Diamond Dew)
      { x: -22.0, z: 32.0, y: 0.85, points: 300 },
      { x: -45.0, z: 42.0, y: 0.85, points: 350 },
      // Zone 5: Bukit Kincir Angin & Kebun Buah
      { x: 28.0, z: 28.0, y: 2.4, points: 300 },
      { x: 36.0, z: 36.0, y: 4.8, points: 400 }, // Puncak bukit kincir
      { x: 42.0, z: 44.0, y: 4.6, points: 500 }, // Dekat menara kincir
      // Jalur Eksplorasi Antar Zona
      { x: 14.0, z: 12.0, y: 0.85, points: 150 },
      { x: -14.0, z: 10.0, y: 0.85, points: 150 },
      { x: 0.0, z: 22.0, y: 0.85, points: 200 }
    ];

    spawnPoints.forEach((sp, idx) => {
      const itemGroup = new THREE.Group();

      // Mini golden tomato fruit
      const fruitGeo = new THREE.SphereGeometry(0.35, 16, 14);
      fruitGeo.scale(1.0, 0.85, 1.0);
      this.disposables.push(fruitGeo);

      const fruit = new THREE.Mesh(fruitGeo, goldMat);
      fruit.castShadow = true;
      itemGroup.add(fruit);

      // Mini calyx on top
      const calyxGeo = new THREE.ConeGeometry(0.08, 0.25, 4);
      calyxGeo.translate(0, 0.12, 0);
      this.disposables.push(calyxGeo);

      for (let s = 0; s < 4; s++) {
        const sepal = new THREE.Mesh(calyxGeo, sepalMat);
        sepal.position.set(0, 0.28, 0);
        sepal.rotation.y = (s * Math.PI) / 2;
        sepal.rotation.z = -1.1;
        itemGroup.add(sepal);
      }

      // Sparkle halo ring
      const haloGeo = new THREE.RingGeometry(0.48, 0.55, 12);
      this.disposables.push(haloGeo);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      itemGroup.add(halo);

      itemGroup.position.set(sp.x, sp.y, sp.z);
      this.group.add(itemGroup);

      this.items.push({
        id: `collectible_${idx}`,
        mesh: itemGroup,
        position: new THREE.Vector3(sp.x, sp.y, sp.z),
        baseY: sp.y,
        active: true,
        radius: 1.1,
        rotationSpeed: 1.5 + (idx % 3) * 0.5,
        points: sp.points
      });
    });
  }

  public update(time: number): void {
    this.items.forEach((item, idx) => {
      if (!item.active) return;
      // Gentle floating bob
      item.mesh.position.y = item.baseY + Math.sin(time * 3.0 + idx * 0.8) * 0.15;
      // Continuous spin
      item.mesh.rotation.y = time * item.rotationSpeed;
    });
  }

  public checkCollision(playerPos: THREE.Vector3): CollectibleItem | null {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.active) continue;

      const dist = playerPos.distanceTo(item.position);
      if (dist < item.radius) {
        item.active = false;
        item.mesh.visible = false;

        // Continuous rewards loop: auto-respawn after 4 seconds
        setTimeout(() => {
          item.active = true;
          item.mesh.visible = true;
        }, 4000);

        return item;
      }
    }
    return null;
  }

  public resetAll(): void {
    this.items.forEach(item => {
      item.active = true;
      item.mesh.visible = true;
    });
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
