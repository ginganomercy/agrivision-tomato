/**
 * TomatoModel - Procedural Organic Heirloom Tomato Mesh & Character
 * Constructs high-fidelity 6-lobed geometry, firmly anchored calyx,
 * spring-swaying stem, physical clearcoat skin, dew droplets, and toggleable mascot facial features.
 */
import * as THREE from 'three';

export class TomatoModel {
  private group: THREE.Group;               // Root group: world position (x,y,z) & heading (yaw)
  private tiltGroup: THREE.Group;           // Local tilt group: local pitch & banking roll
  private visualMeshGroup: THREE.Group;     // Visual animation group: squash, stretch, and hop stride
  private fruitMesh!: THREE.Mesh;
  private calyxGroup: THREE.Group;
  private stemGroup: THREE.Group;
  private leavesGroup: THREE.Group;
  private mascotGroup: THREE.Group;
  private eyesGroup: THREE.Group;
  private swordGroup: THREE.Group;
  private slashTrailMesh!: THREE.Mesh;
  
  // Animation state
  public static readonly BASE_SCALE = 0.82;
  private stridePhase: number = 0;
  private idlePhase: number = 0;
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private stemSwayPhase: number = 0;
  private slashTimer: number = 0;
  private slashCombo: number = 0;
  
  // Disposal tracking
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.tiltGroup = new THREE.Group();
    this.visualMeshGroup = new THREE.Group();
    this.calyxGroup = new THREE.Group();
    this.stemGroup = new THREE.Group();
    this.leavesGroup = new THREE.Group();
    this.mascotGroup = new THREE.Group();
    this.eyesGroup = new THREE.Group();
    this.swordGroup = new THREE.Group();

    this.group.add(this.tiltGroup);
    this.tiltGroup.add(this.visualMeshGroup);

    this.buildTomatoBody();
    this.buildCalyxAndStem();
    this.buildDewDrops();
    this.buildMascotFace();
    this.buildSword();

    this.visualMeshGroup.add(this.calyxGroup);
    this.visualMeshGroup.add(this.stemGroup);
    this.visualMeshGroup.add(this.leavesGroup);
    this.visualMeshGroup.add(this.mascotGroup);
    this.visualMeshGroup.add(this.swordGroup);

    // Initial scale
    this.visualMeshGroup.scale.set(TomatoModel.BASE_SCALE, TomatoModel.BASE_SCALE, TomatoModel.BASE_SCALE);
  }

  public getRoot(): THREE.Group {
    return this.group;
  }

  /**
   * Constructs organic 6-lobed heirloom tomato fruit geometry
   */
  private buildTomatoBody(): void {
    // Generate organic 6-lobed parametric sphere
    const widthSegments = 48;
    const heightSegments = 36;
    const radius = 1.0;
    const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const posAttr = geo.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      // Polar angle & Azimuthal angle
      const theta = Math.atan2(z, x); // around Y axis
      const rHorizontal = Math.sqrt(x * x + z * z);
      const phi = Math.atan2(rHorizontal, y); // from Y axis

      // 6-lobed furrow profile (classic heirloom/beefsteak tomato contour)
      const lobeModulation = 1.0 + 0.11 * Math.cos(6.0 * theta) * Math.sin(phi);
      // Slightly oblate height (squashed vertically like real mature fruit)
      const heightModulation = 0.88;
      // Indentation at bottom and apex calyx seat
      const apexIndent = 1.0 - 0.08 * Math.pow(Math.cos(phi), 4.0);

      x *= lobeModulation * apexIndent;
      z *= lobeModulation * apexIndent;
      y *= heightModulation * apexIndent;

      posAttr.setXYZ(i, x, y, z);
    }

    geo.computeVertexNormals();
    this.disposables.push(geo);

    // Physical Clearcoat Material (organic skin sheen + lacquer)
    const tomatoMat = new THREE.MeshPhysicalMaterial({
      color: 0xdf1d1d,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.75,
      clearcoatRoughness: 0.18,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xff6666),
      reflectivity: 0.6
    });
    this.disposables.push(tomatoMat);

    this.fruitMesh = new THREE.Mesh(geo, tomatoMat);
    this.fruitMesh.castShadow = true;
    this.fruitMesh.receiveShadow = true;
    this.visualMeshGroup.add(this.fruitMesh);
  }

  /**
   * Constructs realistic calyx sepals welded directly to apex and curved stem
   */
  private buildCalyxAndStem(): void {
    const sepalMat = new THREE.MeshStandardMaterial({
      color: 0x2e8b26,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    this.disposables.push(sepalMat);

    // 5 Star Sepals firmly seated on apex (y ~ 0.84)
    const sepalCount = 5;
    for (let i = 0; i < sepalCount; i++) {
      const angle = (i / sepalCount) * Math.PI * 2 + 0.2;
      const sepalGeo = new THREE.ConeGeometry(0.12, 0.52, 5);
      sepalGeo.translate(0, 0.26, 0); // pivot at base
      this.disposables.push(sepalGeo);

      const sepalMesh = new THREE.Mesh(sepalGeo, sepalMat);
      sepalMesh.position.set(0, 0.82, 0);
      sepalMesh.rotation.y = angle;
      // Arch down slightly to hug the tomato curvature
      sepalMesh.rotation.z = -1.25;
      sepalMesh.castShadow = true;
      this.calyxGroup.add(sepalMesh);
    }

    // Central crown disc
    const discGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.08, 12);
    this.disposables.push(discGeo);
    const discMesh = new THREE.Mesh(discGeo, sepalMat);
    discMesh.position.set(0, 0.84, 0);
    this.calyxGroup.add(discMesh);

    // Pedicel (Main stem) with realistic curve
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.84, 0),
      new THREE.Vector3(0.04, 1.08, 0.02),
      new THREE.Vector3(-0.06, 1.32, -0.04),
      new THREE.Vector3(-0.08, 1.52, -0.06)
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.055, 8, false);
    this.disposables.push(stemGeo);
    const stemMesh = new THREE.Mesh(stemGeo, sepalMat);
    stemMesh.castShadow = true;
    this.stemGroup.add(stemMesh);

    // Mini leaves branching from stem knuckle
    const leafGeo = new THREE.ConeGeometry(0.10, 0.42, 4);
    leafGeo.translate(0, 0.21, 0);
    this.disposables.push(leafGeo);

    const leaf1 = new THREE.Mesh(leafGeo, sepalMat);
    leaf1.position.set(0.04, 1.15, 0.02);
    leaf1.rotation.set(0.6, 0.8, -1.0);
    this.leavesGroup.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeo, sepalMat);
    leaf2.position.set(0.02, 1.22, 0.01);
    leaf2.rotation.set(-0.5, -0.7, 1.1);
    this.leavesGroup.add(leaf2);
  }

  /**
   * Constructs tiny clear dew drops on the top surface
   */
  private buildDewDrops(): void {
    const dewMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    this.disposables.push(dewMat);

    const dropPositions = [
      new THREE.Vector3(0.38, 0.72, 0.42),
      new THREE.Vector3(-0.45, 0.68, 0.35),
      new THREE.Vector3(0.52, 0.65, -0.28),
      new THREE.Vector3(-0.32, 0.74, -0.48),
      new THREE.Vector3(0.15, 0.78, 0.58)
    ];

    dropPositions.forEach((pos, idx) => {
      const dropGeo = new THREE.SphereGeometry(0.04 + (idx % 3) * 0.015, 8, 8);
      dropGeo.scale(1.0, 0.4, 1.0);
      this.disposables.push(dropGeo);
      const dropMesh = new THREE.Mesh(dropGeo, dewMat);
      dropMesh.position.copy(pos);
      this.visualMeshGroup.add(dropMesh);
    });
  }

  /**
   * Constructs expressive anime mascot face (blinking eyes, smile, rosy blush)
   */
  private buildMascotFace(): void {
    // Eyes: Black gloss spheres with white shine dots
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.disposables.push(eyeMat, shineMat);

    const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    this.disposables.push(eyeGeo);

    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.24, 0.12, 0.94);
    const leftShine = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), shineMat);
    leftShine.position.set(-0.022, 0.025, 0.065);
    leftEye.add(leftShine);
    this.eyesGroup.add(leftEye);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.24, 0.12, 0.94);
    const rightShine = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), shineMat);
    rightShine.position.set(-0.022, 0.025, 0.065);
    rightEye.add(rightShine);
    this.eyesGroup.add(rightEye);

    this.mascotGroup.add(this.eyesGroup);

    // Smile: Curved black tube
    const smileCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.14, -0.06, 0.96),
      new THREE.Vector3(0, -0.16, 0.98),
      new THREE.Vector3(0.14, -0.06, 0.96)
    );
    const smileGeo = new THREE.TubeGeometry(smileCurve, 12, 0.02, 6, false);
    this.disposables.push(smileGeo);
    const smileMesh = new THREE.Mesh(smileGeo, eyeMat);
    this.mascotGroup.add(smileMesh);

    // Rosy Blush Cheeks
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xff6b81,
      transparent: true,
      opacity: 0.65
    });
    this.disposables.push(blushMat);

    const blushGeo = new THREE.SphereGeometry(0.10, 12, 12);
    blushGeo.scale(1.2, 0.5, 0.1);
    this.disposables.push(blushGeo);

    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.40, -0.04, 0.88);
    leftBlush.rotation.y = -0.35;
    this.mascotGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.40, -0.04, 0.88);
    rightBlush.rotation.y = 0.35;
    this.mascotGroup.add(rightBlush);
  }

  /**
   * Constructs 3D Fantasy Botanical Leaf Blade (Sword Weapon)
   */
  private buildSword(): void {
    const swordBladeMat = new THREE.MeshStandardMaterial({
      color: 0xecf0f1,
      metalness: 0.92,
      roughness: 0.15
    });
    const goldGuardMat = new THREE.MeshStandardMaterial({
      color: 0xf39c12,
      metalness: 0.85,
      roughness: 0.25
    });
    const emeraldGemMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      roughness: 0.1,
      emissive: 0x27ae60,
      emissiveIntensity: 0.45
    });
    const hiltLeatherMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.85
    });
    const slashTrailMat = new THREE.MeshBasicMaterial({
      color: 0x70ffdd,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.disposables.push(swordBladeMat, goldGuardMat, emeraldGemMat, hiltLeatherMat, slashTrailMat);

    // 1. Blade body (Length 0.72m, tapered dual edge)
    const bladeGeo = new THREE.BoxGeometry(0.09, 0.72, 0.024);
    bladeGeo.translate(0, 0.44, 0); // pivot at guard
    this.disposables.push(bladeGeo);
    const bladeMesh = new THREE.Mesh(bladeGeo, swordBladeMat);
    bladeMesh.castShadow = true;
    this.swordGroup.add(bladeMesh);

    // Pointed blade tip
    const tipGeo = new THREE.ConeGeometry(0.065, 0.22, 4);
    tipGeo.rotateY(Math.PI / 4);
    tipGeo.translate(0, 0.88, 0);
    this.disposables.push(tipGeo);
    const tipMesh = new THREE.Mesh(tipGeo, swordBladeMat);
    tipMesh.castShadow = true;
    this.swordGroup.add(tipMesh);

    // Green fuller line (Leaf Rune)
    const runeGeo = new THREE.BoxGeometry(0.02, 0.55, 0.026);
    runeGeo.translate(0, 0.40, 0);
    this.disposables.push(runeGeo);
    const runeMesh = new THREE.Mesh(runeGeo, emeraldGemMat);
    this.swordGroup.add(runeMesh);

    // 2. Crossguard (Winged botanical guard)
    const guardGeo = new THREE.BoxGeometry(0.32, 0.06, 0.07);
    guardGeo.translate(0, 0.06, 0);
    this.disposables.push(guardGeo);
    const guardMesh = new THREE.Mesh(guardGeo, goldGuardMat);
    guardMesh.castShadow = true;
    this.swordGroup.add(guardMesh);

    // Emerald center gem
    const gemGeo = new THREE.SphereGeometry(0.045, 8, 8);
    gemGeo.translate(0, 0.06, 0.038);
    this.disposables.push(gemGeo);
    const gemMesh = new THREE.Mesh(gemGeo, emeraldGemMat);
    this.swordGroup.add(gemMesh);

    // 3. Grip & Pommel
    const gripGeo = new THREE.CylinderGeometry(0.032, 0.035, 0.22, 8);
    gripGeo.translate(0, -0.07, 0);
    this.disposables.push(gripGeo);
    const gripMesh = new THREE.Mesh(gripGeo, hiltLeatherMat);
    this.swordGroup.add(gripMesh);

    const pommelGeo = new THREE.SphereGeometry(0.055, 8, 8);
    pommelGeo.translate(0, -0.20, 0);
    this.disposables.push(pommelGeo);
    const pommelMesh = new THREE.Mesh(pommelGeo, goldGuardMat);
    this.swordGroup.add(pommelMesh);

    // 4. Slash Trail Arc (Crescent sweep ribbon)
    const arcGeo = new THREE.RingGeometry(0.65, 1.15, 16, 1, 0, Math.PI * 0.75);
    arcGeo.rotateX(Math.PI / 2);
    this.disposables.push(arcGeo);
    this.slashTrailMesh = new THREE.Mesh(arcGeo, slashTrailMat);
    this.slashTrailMesh.position.set(0, 0.15, 0.35);
    this.slashTrailMesh.visible = false;
    this.visualMeshGroup.add(this.slashTrailMesh);

    // Initial position: sheathed at right flank
    this.swordGroup.position.set(0.72, 0.15, -0.15);
    this.swordGroup.rotation.set(0.35, 0.25, 0.65);
  }

  public triggerSlash(): boolean {
    if (this.slashTimer > 0.08) return false;
    this.slashTimer = 0.28;
    this.slashCombo = (this.slashCombo + 1) % 2;
    return true;
  }

  public isSlashing(): boolean {
    return this.slashTimer > 0;
  }

  public setMascotVisible(visible: boolean): void {
    this.mascotGroup.visible = visible;
  }

  /**
   * Updates all dynamic animations on the character:
   * - Local banking tilt and acceleration pitch on tiltGroup
   * - Organic mascot stride hop, idle breathing, and volume-conserving squash & stretch on visualMeshGroup
   * - Dynamic harmonic stem spring inertia and secondary leaf flutter
   * - Expressive eye blinking
   * - Dynamic 3D Sword slashing and blade trail arcs
   */
  public updateAnimation(
    deltaTime: number,
    velocityMag: number,
    isGrounded: boolean,
    velocityY: number = 0,
    pitch: number = 0,
    roll: number = 0
  ): void {
    // 1. Apply local directional tilt on tiltGroup (in character's local heading space)
    this.tiltGroup.rotation.x = pitch;
    this.tiltGroup.rotation.z = roll;

    // 2. Organic mascot stride hop and squash & stretch on visualMeshGroup
    const baseScale = TomatoModel.BASE_SCALE;

    if (!isGrounded) {
      // Airborne kinematics (stretches along vertical velocity vector with volume conservation)
      const stretch = THREE.MathUtils.clamp(1.0 + velocityY * 0.022, 0.82, 1.24);
      const radScale = baseScale / Math.sqrt(stretch);
      const vertScale = baseScale * stretch;
      this.visualMeshGroup.scale.set(radScale, vertScale, radScale);
      this.visualMeshGroup.position.set(0, 0, 0);
      this.visualMeshGroup.rotation.z = 0;
    } else if (velocityMag > 0.25) {
      // Grounded locomotive stride hop (organic mascot running kinetics)
      const strideRate = 8.5 + velocityMag * 0.75;
      this.stridePhase += deltaTime * strideRate;

      // Vertical rhythmic stride bounce (hop up and land on feet/bottom)
      const hopHeight = Math.abs(Math.sin(this.stridePhase)) * Math.min(0.045, 0.015 + velocityMag * 0.0035);
      this.visualMeshGroup.position.y = hopHeight;

      // Subtle mascot side-to-side waddle sway
      const waddleRoll = Math.sin(this.stridePhase) * Math.min(0.05, 0.018 + velocityMag * 0.003);
      this.visualMeshGroup.rotation.z = waddleRoll;

      // Harmonic volume-conserved squash on step touchdown
      const squashFactor = Math.cos(this.stridePhase * 2.0) * Math.min(0.04, 0.012 + velocityMag * 0.003);
      const scaleY = baseScale * (1.0 - squashFactor);
      const scaleXZ = baseScale / Math.sqrt(Math.max(0.7, 1.0 - squashFactor));
      this.visualMeshGroup.scale.set(scaleXZ, scaleY, scaleXZ);
    } else {
      // Idle state: gentle rhythmic resting breathing (1.6 Hz)
      this.idlePhase += deltaTime * 2.4;
      const breath = Math.sin(this.idlePhase) * 0.014;
      const scaleY = baseScale * (1.0 - breath);
      const scaleXZ = baseScale / Math.sqrt(1.0 - breath);
      this.visualMeshGroup.scale.set(scaleXZ, scaleY, scaleXZ);
      this.visualMeshGroup.position.set(0, 0, 0);
      this.visualMeshGroup.rotation.z = 0;
    }

    // 3. Dynamic Stem Spring Inertia & Leaf Flexing
    this.stemSwayPhase += deltaTime * (3.5 + velocityMag * 5.0);
    const swayAmplitude = isGrounded ? 0.06 + Math.min(velocityMag * 0.08, 0.18) : 0.20;
    // Counter-inertial stem reaction to pitch acceleration
    const stemPitchInertia = -pitch * 0.45;
    this.stemGroup.rotation.x = stemPitchInertia;
    this.stemGroup.rotation.z = Math.sin(this.stemSwayPhase) * swayAmplitude - roll * 0.35;
    this.leavesGroup.rotation.z = Math.sin(this.stemSwayPhase * 1.3) * (swayAmplitude * 1.25);

    // 4. Expressive Mascot Eye Blinking
    this.blinkTimer += deltaTime;
    if (!this.isBlinking && this.blinkTimer > 3.8) {
      if (Math.random() < 0.35) {
        this.isBlinking = true;
        this.blinkTimer = 0;
      }
    }

    if (this.isBlinking) {
      this.eyesGroup.scale.y = 0.12; // squint
      if (this.blinkTimer > 0.12) {
        this.eyesGroup.scale.y = 1.0;
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    } else {
      this.eyesGroup.scale.y = 1.0;
    }

    // 5. Dynamic 3D Sword Animation & Slash Swing
    if (this.slashTimer > 0) {
      this.slashTimer -= deltaTime;
      const progress = Math.max(0, 1.0 - this.slashTimer / 0.28);
      const isReverse = this.slashCombo === 1;
      const startAngle = isReverse ? Math.PI * 0.55 : -Math.PI * 0.45;
      const endAngle = isReverse ? -Math.PI * 0.45 : Math.PI * 0.55;
      const currentAngle = THREE.MathUtils.lerp(startAngle, endAngle, progress);

      this.swordGroup.position.set(
        Math.cos(currentAngle) * 0.65,
        0.20 + Math.sin(progress * Math.PI) * 0.18,
        Math.sin(currentAngle) * 0.55 + 0.35
      );
      this.swordGroup.rotation.set(
        0.35,
        currentAngle + Math.PI / 2,
        isReverse ? -1.1 : 1.1
      );

      // Flash slash trail arc
      this.slashTrailMesh.visible = true;
      (this.slashTrailMesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * 0.85;
      this.slashTrailMesh.rotation.y = isReverse ? -currentAngle : currentAngle;
    } else {
      // Resting position at right hip
      this.swordGroup.position.set(0.72, 0.15, -0.15);
      this.swordGroup.rotation.set(0.35, 0.25, 0.65);
      this.slashTrailMesh.visible = false;
    }
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
