/**
 * AgriVision 3D Engine - Core Type Definitions & Interfaces
 * Establishes explicit contracts between 3D systems, physics, and React UI.
 */
import * as THREE from 'three';

export interface WorldCallbacks {
  onScoreChange?: (score: number) => void;
  onSpeedChange?: (speedPercent: number) => void;
  onBounce?: (bounceCount: number) => void;
  onZoneChange?: (zoneName: string) => void;
  onPlayerUpdate?: (pos: { x: number; z: number }, heading: number) => void;
  onQuestUpdate?: (defeated: number, total: number) => void;
  onQuestComplete?: (rewardScore: number) => void;
  onRoomTransition?: (transition: RoomTransition) => void;
  onInventoryUpdate?: (items: InventoryItem[]) => void;
  onItemLooted?: (itemName: string, icon: string, qty: number) => void;
}

export type RoomLocation = 'meadow' | 'greenhouse' | 'tavern' | 'windmill';

export interface RoomTransition {
  isTransitioning: boolean;
  location: RoomLocation;
  title: string;
  subtitle: string;
  icon: string;
}

export type ItemCategory = 'weapon' | 'produce' | 'loot' | 'consumable';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  icon: string;
  description: string;
  count: number;
  maxStack: number;
  attackBonus?: number;
  speedBonus?: number;
  isEquipped?: boolean;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  turbo: boolean;
  spin: boolean;
  attack: boolean; // Sword slash attack
}

export interface PhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  heading: number;
  pitch: number;
  roll: number;
  isGrounded: boolean;
  isBoosting: boolean;
  bounceCount: number;
  score: number;
  currentZone: string;
}

export interface CollectibleItem {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  baseY: number;
  active: boolean;
  radius: number;
  rotationSpeed: number;
  points: number;
}

export type CameraMode = 'chase' | 'orbit';

export interface WorldEngineOptions {
  enableAudio: boolean;
  mascotMode: boolean;
  cameraMode: CameraMode;
  callbacks: WorldCallbacks;
}
