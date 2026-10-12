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
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  turbo: boolean;
  spin: boolean;
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
  currentZone: 'greenhouse' | 'meadow';
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
