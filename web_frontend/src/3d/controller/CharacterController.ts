/**
 * CharacterController - Arcade Kinematics & Camera-Relative Movement Controller
 * Implements intuitive camera-relative navigation (W=forward relative to view, S=backward, A/D=smooth strafe),
 * smooth yaw heading, banking tilt, waddle squish & stretch, jump bounce physics,
 * and guarantees the stem stays oriented upright (never flips upside-down).
 */
import * as THREE from 'three';
import type { InputState, PhysicsState } from '../types';

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

  // Kinematic tuning constants - tuned for satisfying smooth gliding momentum
  private static readonly ACCELERATION = 28.0;
  private static readonly TURBO_ACCELERATION = 56.0;
  private static readonly MAX_SPEED = 14.0;
  private static readonly TURBO_MAX_SPEED = 26.0;
  private static readonly FRICTION = 0.93; // Buttery smooth momentum
  private static readonly GRAVITY = -25.0;
  private static readonly JUMP_VELOCITY = 10.8;
  private static readonly BOUNDARY_LIMIT = 82.0; // 180m Open world perimeter boundary

  constructor(initialPosition: THREE.Vector3 = new THREE.Vector3(0, 0.82, -1.0)) {
    this.position.copy(initialPosition);
    this.heading = 0;
    this.targetHeading = 0;
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

  public resetPosition(): void {
    this.position.set(0, 0.82, -1.0);
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

    // 2. Acceleration & Turbo
    const isBoosting = input.turbo;
    const accel = isBoosting ? CharacterController.TURBO_ACCELERATION : CharacterController.ACCELERATION;
    const maxSpd = isBoosting ? CharacterController.TURBO_MAX_SPEED : CharacterController.MAX_SPEED;

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

    // Topographic Ground Elevation Calculation
    let currentGroundY = 0.68;
    if (isInsideGreenhouse) {
      currentGroundY = 0.82; // Elevated terracotta laboratory floor
    } else {
      // Windmill Hill elevation (mound at x=38, z=40, radius 20m)
      const dxHill = (this.position.x - 38) / 20;
      const dzHill = (this.position.z - 40) / 20;
      const hillDistSq = dxHill * dxHill + dzHill * dzHill;
      if (hillDistSq < 1.0) {
        currentGroundY = 0.68 + (1.0 - Math.sqrt(hillDistSq)) * 4.4;
      }
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
    // Doorway is on South wall: Z = 7, X between -2.5 and +2.5
    if (isInsideGreenhouse) {
      // Inside: bounce off walls except doorway
      if (this.position.x < -8.3) { this.position.x = -8.3; this.velocity.x *= -0.3; }
      if (this.position.x > 8.3) { this.position.x = 8.3; this.velocity.x *= -0.3; }
      if (this.position.z < -6.3) { this.position.z = -6.3; this.velocity.z *= -0.3; }
      // South wall check
      if (this.position.z > 6.4 && Math.abs(this.position.x) > 2.2) {
        this.position.z = 6.4;
        this.velocity.z *= -0.3;
      }
    } else {
      // Outside: cannot enter greenhouse through solid glass walls
      // Can only enter via doorway at Z = 7, X in [-2.4, 2.4]
      if (
        this.position.x > -9.2 && this.position.x < 9.2 &&
        this.position.z > -7.2 && this.position.z < 7.2
      ) {
        // Entering through doorway
        if (Math.abs(this.position.x) > 2.4) {
          // Hit the south outer glass wall
          if (this.position.z < 7.5 && this.position.z > 6.0) {
            this.position.z = 7.5;
            this.velocity.z = Math.max(0, this.velocity.z);
          }
        }
      }
    }

    // Lake Shoreline Soft-Push Collision (Center x=-35, z=35, radius 19.5m)
    // Allows standing on wooden observation pier at x in [-37, -33], z in [20, 29]
    const distToLake = Math.hypot(this.position.x - (-35), this.position.z - 35);
    const isOnPier = this.position.x >= -37.5 && this.position.x <= -32.5 && this.position.z >= 19.0 && this.position.z <= 29.5;
    if (distToLake < 19.2 && !isOnPier) {
      const angle = Math.atan2(this.position.z - 35, this.position.x - (-35));
      this.position.x = -35 + Math.cos(angle) * 19.3;
      this.position.z = 35 + Math.sin(angle) * 19.3;
      this.velocity.x *= -0.3;
      this.velocity.z *= -0.3;
    }
  }

  public getZoneName(isInsideGreenhouse: boolean): string {
    if (isInsideGreenhouse) return 'Ruang Laboratorium Botani';
    if (this.position.x > 15 && this.position.z < -10) return 'Kebun Tomat Komersial (Trellis)';
    if (this.position.x < -15 && this.position.z < -10) return 'Taman Bunga & Polinator';
    if (this.position.x < -15 && this.position.z > 12) return 'Danau Irigasi Botani';
    if (this.position.x > 15 && this.position.z > 15) return 'Bukit Kincir Angin & Kebun Buah';
    return 'Hamparan Padang Rumput Hijau';
  }
}
