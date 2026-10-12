/**
 * CharacterController - Arcade Kinematics & Camera-Relative Movement Controller
 * Implements intuitive camera-relative navigation (W=forward relative to view, S=backward, A/D=smooth strafe),
 * smooth yaw heading, banking tilt, waddle squish & stretch, jump bounce physics,
 * and guarantees the stem stays oriented upright (never flips upside-down).
 */
import * as THREE from 'three';
import type { InputState, PhysicsState } from '../types';
import { BotanicalMeadow } from '../world/BotanicalMeadow';

export class CharacterController {
  // Spatial vectors
  private position: THREE.Vector3 = new THREE.Vector3(0, 0.82, -1.0);
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Orientation angles (radians) - 0 rad faces South (+Z) towards the greenhouse doorway
  private heading: number = 0;
  private targetHeading: number = 0;
  private tiltPitch: number = 0;     // Subtle forward/backward lean (X axis)
  private tiltRoll: number = 0;      // Subtle banking roll (Z axis)

  // Vertical mechanics
  private isGrounded: boolean = true;
  private bounceCount: number = 0;
  private score: number = 0;

  // Spin trick state
  private spinTimer: number = 0;
  private isSpinning: boolean = false;

  // Speed booster state (from Consumable NPK fertilizer)
  private speedBoostMultiplier: number = 1.0;
  private speedBoostTimer: number = 0;

  // Kinematic tuning constants - tuned for satisfying smooth gliding momentum
  private static readonly ACCELERATION = 28.0;
  private static readonly TURBO_ACCELERATION = 56.0;
  private static readonly MAX_SPEED = 14.0;
  private static readonly TURBO_MAX_SPEED = 26.0;
  private static readonly FRICTION = 0.93; // Buttery smooth momentum
  private static readonly GRAVITY = -25.0;
  private static readonly JUMP_VELOCITY = 10.8;
  private static readonly BOUNDARY_LIMIT = 82.0; // 180m Open world perimeter boundary

  constructor(initialPosition: THREE.Vector3 = new THREE.Vector3(0, 0.86, -1.0)) {
    this.position.copy(initialPosition);
    this.heading = 0;
    this.targetHeading = 0;
  }

  public warpTo(x: number, y: number, z: number, heading?: number): void {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    if (heading !== undefined) {
      this.heading = heading;
      this.targetHeading = heading;
    }
  }

  public applySpeedBoost(boostRatio: number, durationSeconds: number): void {
    this.speedBoostMultiplier = 1.0 + boostRatio;
    this.speedBoostTimer = durationSeconds;
  }

  public getPosition(): THREE.Vector3 {
    return this.position;
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity;
  }

  public getHeading(): number {
    return this.heading;
  }

  public getTilt(): { pitch: number; roll: number } {
    return { pitch: this.tiltPitch, roll: this.tiltRoll };
  }

  public getScore(): number {
    return this.score;
  }

  public addScore(points: number): void {
    this.score += points;
  }

  public getBounceCount(): number {
    return this.bounceCount;
  }

  public triggerJump(): boolean {
    if (this.isGrounded) {
      this.velocity.y = CharacterController.JUMP_VELOCITY;
      this.isGrounded = false;
      this.bounceCount += 1;
      return true;
    }
    return false;
  }

  public triggerSpin(): boolean {
    if (!this.isSpinning) {
      this.isSpinning = true;
      this.spinTimer = 0.45; // duration in seconds
      this.score += 50;
      return true;
    }
    return false;
  }

  public getIsSpinning(): boolean {
    return this.isSpinning;
  }

  public resetPosition(): void {
    this.position.set(0, 0.86, -1.0);
    this.velocity.set(0, 0, 0);
    this.heading = 0;
    this.targetHeading = 0;
    this.tiltPitch = 0;
    this.tiltRoll = 0;
    this.isGrounded = true;
  }

  public update(
    deltaTime: number,
    input: InputState,
    isInsideGreenhouse: boolean,
    camForward: THREE.Vector3,
    camRight: THREE.Vector3
  ): { state: PhysicsState; justBounced: boolean; justLanded: boolean } {
    const clampedDt = Math.min(deltaTime, 0.1);
    let justBounced = false;
    let justLanded = false;

    // 1. Process Intuitive Camera-Relative Movement Direction
    // W = moves forward along camera view direction
    // S = moves backward along camera view direction
    // D = smooth strafe right relative to camera view
    // A = smooth strafe left relative to camera view
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (input.forward) moveDir.add(camForward);
    if (input.backward) moveDir.sub(camForward);
    if (input.right) moveDir.add(camRight);
    if (input.left) moveDir.sub(camRight);

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
    }

    // 2. Acceleration & Turbo (with active consumable boost multiplier)
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= clampedDt;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostMultiplier = 1.0;
      }
    }

    const isBoosting = input.turbo;
    const accel = (isBoosting ? CharacterController.TURBO_ACCELERATION : CharacterController.ACCELERATION) * this.speedBoostMultiplier;
    const maxSpd = (isBoosting ? CharacterController.TURBO_MAX_SPEED : CharacterController.MAX_SPEED) * this.speedBoostMultiplier;

    this.velocity.x += moveDir.x * accel * clampedDt;
    this.velocity.z += moveDir.z * accel * clampedDt;

    // Ground friction (buttery smooth gliding momentum)
    this.velocity.x *= Math.pow(CharacterController.FRICTION, clampedDt * 60);
    this.velocity.z *= Math.pow(CharacterController.FRICTION, clampedDt * 60);

    // Speed clamping
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (horizontalSpeed > maxSpd) {
      const ratio = maxSpd / horizontalSpeed;
      this.velocity.x *= ratio;
      this.velocity.z *= ratio;
    }

    // 3. Jump and Gravity
    if (input.jump && this.isGrounded) {
      this.velocity.y = CharacterController.JUMP_VELOCITY;
      this.isGrounded = false;
      this.bounceCount += 1;
      justBounced = true;
    }

    // Apply gravity
    this.velocity.y += CharacterController.GRAVITY * clampedDt;
    this.position.y += this.velocity.y * clampedDt;

    // Multi-Level Surface Elevation Calculation (Terrain + Windmill Stairs/Terrace + Tavern + Pier)
    let currentGroundY = 0.74; // Outdoor meadow terrain base
    if (isInsideGreenhouse) {
      currentGroundY = 0.86; // Elevated terracotta laboratory floor
    } else {
      // Accurately conform to multi-level architectural structures (no sinking!)
      currentGroundY = BotanicalMeadow.getSurfaceElevation(this.position.x, this.position.z) + 0.74;
    }

    if (this.position.y <= currentGroundY) {
      this.position.y = currentGroundY;
      if (!this.isGrounded) {
        justLanded = true;
        // Bounce damping if falling fast
        if (this.velocity.y < -4.0) {
          this.velocity.y = -this.velocity.y * 0.28;
          this.bounceCount += 1;
          justBounced = true;
        } else {
          this.velocity.y = 0;
          this.isGrounded = true;
        }
      }
    } else {
      this.isGrounded = false;
    }

    // 4. Update Horizontal Position
    this.position.x += this.velocity.x * clampedDt;
    this.position.z += this.velocity.z * clampedDt;

    // 5. Environmental Collisions & Boundary Clamping
    this.handleCollisions(isInsideGreenhouse);

    // 6. Upright Heading Yaw & Banking Tilt (Faces actual movement vector)
    if (horizontalSpeed > 0.3) {
      this.targetHeading = Math.atan2(this.velocity.x, this.velocity.z);
      // Smooth interpolation for heading yaw
      let diff = this.targetHeading - this.heading;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.heading += diff * Math.min(1.0, clampedDt * 10.0);

      // Banking lean into turns (max ~18 degrees)
      const targetRoll = (-diff * horizontalSpeed * 0.08);
      this.tiltRoll = THREE.MathUtils.clamp(targetRoll, -0.32, 0.32);

      // Pitch lean forwards while accelerating
      const targetPitch = (horizontalSpeed / maxSpd) * 0.18;
      this.tiltPitch = THREE.MathUtils.clamp(targetPitch, -0.22, 0.22);
    } else {
      this.tiltRoll *= 0.85;
      this.tiltPitch *= 0.85;
    }

    // 7. Spin Trick Handling (Yaw pirouette)
    if (this.isSpinning) {
      this.heading += Math.PI * 14 * clampedDt;
      this.spinTimer -= clampedDt;
      if (this.spinTimer <= 0) {
        this.isSpinning = false;
      }
    }

    // Construct Physics Snapshot
    const state: PhysicsState = {
      position: this.position.clone(),
      velocity: this.velocity.clone(),
      heading: this.heading,
      pitch: this.tiltPitch,
      roll: this.tiltRoll,
      isGrounded: this.isGrounded,
      isBoosting,
      bounceCount: this.bounceCount,
      score: this.score,
      currentZone: this.getZoneName(isInsideGreenhouse)
    };

    return { state, justBounced, justLanded };
  }

  private handleCollisions(isInsideGreenhouse: boolean): void {
    const limit = CharacterController.BOUNDARY_LIMIT;

    // Outer 180m perimeter boundary clamp
    if (this.position.x < -limit) { this.position.x = -limit; this.velocity.x *= -0.4; }
    if (this.position.x > limit) { this.position.x = limit; this.velocity.x *= -0.4; }
    if (this.position.z < -limit) { this.position.z = -limit; this.velocity.z *= -0.4; }
    if (this.position.z > limit) { this.position.z = limit; this.velocity.z *= -0.4; }

    // Greenhouse Wall Collisions (Width 18: [-9, 9], Depth 14: [-7, 7])
    if (isInsideGreenhouse) {
      // Inside: keep strictly inside interior laboratory walls
      if (this.position.x < -8.25) { this.position.x = -8.25; this.velocity.x *= -0.2; }
      if (this.position.x > 8.25) { this.position.x = 8.25; this.velocity.x *= -0.2; }
      if (this.position.z < -6.25) { this.position.z = -6.25; this.velocity.z *= -0.2; }
      // South wall: doorway opening is at |x| <= 1.8. Anywhere else, bounce off!
      if (this.position.z > 6.45 && Math.abs(this.position.x) > 1.8) {
        this.position.z = 6.45;
        this.velocity.z *= -0.2;
      }
    } else {
      // Outside: 100% SOLID IMPENETRABLE WALLS on North, East, West, and South faces!
      // Minkowski box: x in [-9.75, 9.75], z in [-7.75, 7.75]
      const minX = -9.75;
      const maxX = 9.75;
      const minZ = -7.75;
      const maxZ = 7.75;
      if (
        this.position.x > minX && this.position.x < maxX &&
        this.position.z > minZ && this.position.z < maxZ
      ) {
        // Only allow passage in South Doorway portal corridor
        const inDoorwayCorridor = Math.abs(this.position.x) <= 1.8 && this.position.z >= 6.4;
        if (!inDoorwayCorridor) {
          const dW = this.position.x - minX;
          const dE = maxX - this.position.x;
          const dN = this.position.z - minZ;
          const dS = maxZ - this.position.z;
          const minD = Math.min(dW, dE, dN, dS);

          if (minD === dN) {
            this.position.z = minZ - 0.05;
            this.velocity.z = Math.min(0, this.velocity.z);
          } else if (minD === dW) {
            this.position.x = minX - 0.05;
            this.velocity.x = Math.min(0, this.velocity.x);
          } else if (minD === dE) {
            this.position.x = maxX + 0.05;
            this.velocity.x = Math.max(0, this.velocity.x);
          } else {
            this.position.z = maxZ + 0.05;
            this.velocity.z = Math.max(0, this.velocity.z);
          }
        }
      }
    }

    // 1. Greenhouse Furnishings Collision (Workbenches inside laboratory)
    if (isInsideGreenhouse) {
      // Left Workbench: x in [-8.2, -4.8], z in [-3.2, -1.8]
      if (this.position.x > -8.5 && this.position.x < -4.5 && this.position.z > -3.5 && this.position.z < -1.5) {
        if (this.position.z > -2.5) this.position.z = -1.45;
        else this.position.z = -3.55;
        this.velocity.z *= -0.2;
      }
      // Right Workbench: x in [4.8, 8.2], z in [-3.2, -1.8]
      if (this.position.x > 4.5 && this.position.x < 8.5 && this.position.z > -3.5 && this.position.z < -1.5) {
        if (this.position.z > -2.5) this.position.z = -1.45;
        else this.position.z = -3.55;
        this.velocity.z *= -0.2;
      }
    }

    // 2. Lake Shoreline & Grand Botanical Bridge (Center x=-35, z=35, lake radius 20m)
    // Allows full-span crossing along Grand Botanical Arch Bridge & Central Lotus Gazebo (z: 13.2 to 56.8)
    const distToLake = Math.hypot(this.position.x - (-35), this.position.z - 35);
    const isOnGazebo = distToLake <= 4.45;
    const isOnBridgeSpan = Math.abs(this.position.x - (-35)) <= 2.05 && this.position.z >= 13.2 && this.position.z <= 56.8;
    const isOnBridge = isOnGazebo || isOnBridgeSpan;

    if (isOnBridge) {
      // Lateral Bridge Safety Railing Clamping:
      // Prevents falling off the sides into lake water while crossing
      if (this.position.z < 30.6 || this.position.z > 39.4) {
        // On North or South bridge span walkways: clamp inside handrails (|dx| <= 1.62)
        const dx = this.position.x - (-35);
        if (Math.abs(dx) > 1.62) {
          this.position.x = -35 + Math.sign(dx) * 1.62;
          this.velocity.x *= -0.2;
        }
      } else {
        // In Central Lotus Gazebo: clamp within outer perimeter balustrades (r <= 4.18m)
        if (distToLake > 4.18) {
          // Allow passing only through North & South portals (where |dx| <= 1.55)
          const dx = Math.abs(this.position.x - (-35));
          if (dx > 1.55) {
            const angle = Math.atan2(this.position.z - 35, this.position.x - (-35));
            this.position.x = -35 + Math.cos(angle) * 4.16;
            this.position.z = 35 + Math.sin(angle) * 4.16;
            this.velocity.x *= -0.2;
            this.velocity.z *= -0.2;
          }
        }
      }
    } else if (distToLake < 19.4) {
      // Off-bridge lake water collision: push gently back to shoreline
      const angle = Math.atan2(this.position.z - 35, this.position.x - (-35));
      this.position.x = -35 + Math.cos(angle) * 19.5;
      this.position.z = 35 + Math.sin(angle) * 19.5;
      this.velocity.x *= -0.3;
      this.velocity.z *= -0.3;
    }

    // 3. Windmill Tower Solid Anti-Clipping Collision (Center x=38, z=40)
    // Tower stone base radius: 2.25m. Character radius: 0.75m. Minkowski sum: 3.00m
    const distToWindmill = Math.hypot(this.position.x - 38, this.position.z - 40);
    if (distToWindmill < 3.02) {
      const angle = Math.atan2(this.position.z - 40, this.position.x - 38);
      this.position.x = 38 + Math.cos(angle) * 3.05;
      this.position.z = 40 + Math.sin(angle) * 3.05;
      this.velocity.x *= -0.2;
      this.velocity.z *= -0.2;
    }

    // Terrace Railing Collision: When on elevated terrace, prevent falling through railing except at steps
    if (this.position.y >= 5.35 && distToWindmill > 3.95 && distToWindmill < 4.8) {
      const angle = Math.atan2(this.position.z - 40, this.position.x - 38);
      const stairAngle = -Math.PI * 0.75;
      let diffAngle = Math.abs(angle - stairAngle);
      if (diffAngle > Math.PI) diffAngle = Math.PI * 2 - diffAngle;

      // If not facing the open stairs opening (diffAngle >= 0.42), clamp inside railing
      if (diffAngle >= 0.42) {
        this.position.x = 38 + Math.cos(angle) * 3.92;
        this.position.z = 40 + Math.sin(angle) * 3.92;
        this.velocity.x *= -0.2;
        this.velocity.z *= -0.2;
      }
    }

    // 4. Agri-Guild Tavern Solid Collision (Center: x=-14, z=18)
    // Tavern Hall Box: x in [-19.0, -9.0], z in [13.8, 22.2]
    const tMinX = -19.75;
    const tMaxX = -8.25;
    const tMinZ = 13.05;
    const tMaxZ = 22.85;
    if (
      this.position.x > tMinX && this.position.x < tMaxX &&
      this.position.z > tMinZ && this.position.z < tMaxZ
    ) {
      // Push out to the closest outer face
      const distWest = this.position.x - tMinX;
      const distEast = tMaxX - this.position.x;
      const distNorth = this.position.z - tMinZ;
      const distSouth = tMaxZ - this.position.z;
      const minDist = Math.min(distWest, distEast, distNorth, distSouth);

      if (minDist === distSouth) {
        this.position.z = tMaxZ + 0.05;
        this.velocity.z = Math.max(0, this.velocity.z);
      } else if (minDist === distWest) {
        this.position.x = tMinX - 0.05;
        this.velocity.x = Math.min(0, this.velocity.x);
      } else if (minDist === distEast) {
        this.position.x = tMaxX + 0.05;
        this.velocity.x = Math.max(0, this.velocity.x);
      } else {
        this.position.z = tMinZ - 0.05;
        this.velocity.z = Math.min(0, this.velocity.z);
      }
    }
  }

  public getZoneName(isInsideGreenhouse: boolean): string {
    if (isInsideGreenhouse) return 'Ruang Laboratorium Botani';
    const distToLake = Math.hypot(this.position.x - (-35), this.position.z - 35);
    if (distToLake <= 4.45) return 'Paviliun Gazebo Teratai (Danau Irigasi)';
    if (Math.abs(this.position.x - (-35)) <= 2.05 && this.position.z >= 13.2 && this.position.z <= 56.8) {
      return 'Jembatan Kayu Melengkung (Danau Irigasi)';
    }
    if (this.position.x > 15 && this.position.z < -10) return 'Kebun Tomat Komersial (Trellis)';
    if (this.position.x < -15 && this.position.z < -10) return 'Taman Bunga & Polinator';
    if (this.position.x < -7 && this.position.x > -21 && this.position.z > 11 && this.position.z < 26) return 'Kedai Serikat Tani (Agri-Guild Tavern)';
    if (this.position.x < -15 && this.position.z > 12) return 'Danau Irigasi Botani';
    if (this.position.x > 15 && this.position.z > 15) return 'Bukit Kincir Angin & Kebun Buah';
    return 'Hamparan Padang Rumput Hijau';
  }
}
