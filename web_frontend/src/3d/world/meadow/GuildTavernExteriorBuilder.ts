import * as THREE from 'three';

export interface TavernExteriorBuildResult {
  tavernGroup: THREE.Group;
  doorHingeGroup: THREE.Group;
}

/**
 * GuildTavernExteriorBuilder
 * Constructs South-West Agri-Guild Tavern & Bounty Hall (Center: x=-14, z=18)
 * Features:
 * 1. Deep Sub-Surface Stone Foundation Plinth (anchored 1.2m deep into ground)
 * 2. Traditional Half-Timbered Medieval/Pastoral Tavern Architecture (cream plaster & dark oak timbers)
 * 3. Cedar Shingle Double-Pitch Gable Roof with stone chimney & smoke puffs
 * 4. Sheltered Front Porch with carved posts, cider barrels, picnic bench & hanging lanterns
 * 5. Carved hanging wooden sign: "AGRI-GUILD TAVERN"
 * 6. Interactive Bounty Notice Board for pest monster quests
 * 7. Animated Door Hinge Group
 */
export class GuildTavernExteriorBuilder {
  public static build(disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[]): TavernExteriorBuildResult {
    const tavernGroup = new THREE.Group();
    // Located in scenic South-West meadow: x = -14, z = 18
    tavernGroup.position.set(-14, 0, 18);

    // Tavern Material Palette
    const stonePlinthMat = new THREE.MeshStandardMaterial({ color: 0x484239, roughness: 0.95 });
    const plasterWallMat = new THREE.MeshStandardMaterial({ color: 0xe8dfce, roughness: 0.85 });
    const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x3a2213, roughness: 0.8 });
    const cedarRoofMat = new THREE.MeshStandardMaterial({ color: 0x5a341b, roughness: 0.75 });
    const woodDeckMat = new THREE.MeshStandardMaterial({ color: 0x6e4727, roughness: 0.8 });
    const warmGlassMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.2, metalness: 0.3, emissive: 0xff9800, emissiveIntensity: 0.4 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const barrelWoodMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.7 });
    const parchmentMat = new THREE.MeshStandardMaterial({ color: 0xf5eed9, roughness: 0.9 });
    const lanternGlowMat = new THREE.MeshStandardMaterial({ color: 0xffe082, emissive: 0xffb300, emissiveIntensity: 0.9 });

    disposables.push(
      stonePlinthMat, plasterWallMat, timberDarkMat, cedarRoofMat, woodDeckMat,
      warmGlassMat, ironMat, barrelWoodMat, parchmentMat, lanternGlowMat
    );

    // 1. Deep Sub-Surface Foundation Plinth (width 11.5m, depth 13.5m, sinks 1.2m deep into ground)
    const plinthGeo = new THREE.BoxGeometry(11.5, 1.8, 13.5);
    disposables.push(plinthGeo);
    const plinth = new THREE.Mesh(plinthGeo, stonePlinthMat);
    plinth.position.set(0, -0.36, 1.8); // Top surface at y = 0.54
    plinth.receiveShadow = true;
    tavernGroup.add(plinth);

    // 2. Main Tavern Hall Body (Hollow exterior shell with open doorway, width 10m, depth 8m, height 4.6m)
    // Back North Wall
    const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(10.0, 4.6, 0.3), plasterWallMat);
    wallNorth.position.set(0, 2.84, -3.85);
    wallNorth.castShadow = true;
    tavernGroup.add(wallNorth);

    // West Side Wall
    const wallWest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 7.8), plasterWallMat);
    wallWest.position.set(-4.85, 2.84, 0);
    wallWest.castShadow = true;
    tavernGroup.add(wallWest);

    // East Side Wall
    const wallEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 7.8), plasterWallMat);
    wallEast.position.set(4.85, 2.84, 0);
    wallEast.castShadow = true;
    tavernGroup.add(wallEast);

    // Front South Wall (Left panel, Right panel, leaving 1.6m open doorway in center)
    const wallSouthL = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.6, 0.3), plasterWallMat);
    wallSouthL.position.set(-2.9, 2.84, 3.85);
    wallSouthL.castShadow = true;
    tavernGroup.add(wallSouthL);

    const wallSouthR = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.6, 0.3), plasterWallMat);
    wallSouthR.position.set(2.9, 2.84, 3.85);
    wallSouthR.castShadow = true;
    tavernGroup.add(wallSouthR);

    // Over-Door Timber Lintel
    const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.32), timberDarkMat);
    doorLintel.position.set(0, 4.24, 3.85);
    tavernGroup.add(doorLintel);

    // Warm Interior Golden Spill Light (spilling warmly through doorway)
    const interiorGlow = new THREE.PointLight(0xffaa33, 1.8, 8, 1.2);
    interiorGlow.position.set(0, 2.2, 2.8);
    tavernGroup.add(interiorGlow);

    // Half-timbered structural timber frame beams on exterior walls
    // Corner timber pillars
    [[-4.9, -3.9], [4.9, -3.9], [-4.9, 3.9], [4.9, 3.9]].forEach(([bx, bz]) => {
      const cornerPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.6, 0.3), timberDarkMat);
      cornerPost.position.set(bx, 2.84, bz);
      cornerPost.castShadow = true;
      tavernGroup.add(cornerPost);
    });

    // Horizontal sill and top timber plates
    [0.6, 5.1].forEach(hy => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.22, 8.2), timberDarkMat);
      plate.position.set(0, hy, 0);
      tavernGroup.add(plate);
    });

    // 3. Gable Cedar Shingle Roof (Stepped A-frame pitch, apex at y = 7.6m)
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 9.4), cedarRoofMat);
    roofL.position.set(-2.8, 6.2, 0);
    roofL.rotation.z = 0.65;
    roofL.castShadow = true;
    tavernGroup.add(roofL);

    const roofR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 9.4), cedarRoofMat);
    roofR.position.set(2.8, 6.2, 0);
    roofR.rotation.z = -0.65;
    roofR.castShadow = true;
    tavernGroup.add(roofR);

    // Roof Ridge Beam
    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 9.6), timberDarkMat);
    ridgeBeam.position.set(0, 7.5, 0);
    tavernGroup.add(ridgeBeam);

    // Gable triangular wall infills
    const gableFront = new THREE.Mesh(new THREE.ConeGeometry(5.0, 2.4, 4), plasterWallMat);
    gableFront.position.set(0, 6.2, 4.0);
    gableFront.rotation.y = Math.PI / 4;
    tavernGroup.add(gableFront);

    // 4. Stone Chimney with warm hearth smoke (East side of tavern at x = 4.6)
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8.2, 1.4), stonePlinthMat);
    chimney.position.set(4.6, 4.2, -1.5);
    chimney.castShadow = true;
    tavernGroup.add(chimney);

    const chimneyPot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.9, 8), timberDarkMat);
    chimneyPot.position.set(4.6, 8.6, -1.5);
    tavernGroup.add(chimneyPot);

    // 5. Sheltered Front Porch (width 10.0m, depth 3.6m, spans z: 4.0 to 7.6)
    const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.16, 3.6), woodDeckMat);
    porchDeck.position.set(0, 0.50, 5.8);
    porchDeck.receiveShadow = true;
    tavernGroup.add(porchDeck);

    // Front Porch Arrival Steps (descending to ground at z = 7.9)
    const porchStep = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 1.2), stonePlinthMat);
    porchStep.position.set(0, 0.28, 7.8);
    porchStep.receiveShadow = true;
    tavernGroup.add(porchStep);

    // Porch carved timber posts (4 posts along front at z = 7.4)
    [-4.6, -1.5, 1.5, 4.6].forEach(px => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), timberDarkMat);
      post.position.set(px, 1.9, 7.4);
      post.castShadow = true;
      tavernGroup.add(post);
    });

    // Porch Canopy Roof (sloping forward from tavern wall)
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.16, 3.8), cedarRoofMat);
    canopyRoof.position.set(0, 3.4, 5.8);
    canopyRoof.rotation.x = 0.22;
    canopyRoof.castShadow = true;
    tavernGroup.add(canopyRoof);

    // 6. Arched Main Tavern Doorway with Dynamic Hinged Swinging Door (at front wall z = 4.05)
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.25), timberDarkMat);
    doorFrame.position.set(0, 1.95, 4.05);
    tavernGroup.add(doorFrame);

    // Hinge Pivot Group (Pivoting at left door jamb x = -0.65)
    const doorHingeGroup = new THREE.Group();
    doorHingeGroup.position.set(-0.65, 0.7, 4.05);

    // Door Leaf Mesh (Shifted +0.65 so it pivots cleanly on its left edge!)
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.5, 0.12), timberDarkMat);
    doorLeaf.position.set(0.65, 1.25, 0);
    doorLeaf.castShadow = true;
    doorHingeGroup.add(doorLeaf);

    // Iron Band Strap Hinges & Ring Knocker
    [-0.7, 0.7].forEach(hy => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.16), ironMat);
      strap.position.set(0.48, 1.25 + hy, 0);
      doorHingeGroup.add(strap);
    });

    const ironKnocker = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 10), ironMat);
    ironKnocker.position.set(1.0, 1.25, 0.08);
    doorHingeGroup.add(ironKnocker);

    tavernGroup.add(doorHingeGroup);

    // Warm Leaded Glass Windows with welcoming interior glow
    [-2.8, 2.8].forEach(wx => {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.2), timberDarkMat);
      winFrame.position.set(wx, 2.3, 4.05);
      tavernGroup.add(winFrame);

      const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), warmGlassMat);
      winGlass.position.set(wx, 2.3, 4.16);
      tavernGroup.add(winGlass);
    });

    // Brass Wall Lanterns with warm glow
    [-1.2, 1.2].forEach(lx => {
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.2), lanternGlowMat);
      lantern.position.set(lx, 2.8, 4.3);
      tavernGroup.add(lantern);
    });

    // 7. Hanging Tavern Signboard: "AGRI-GUILD TAVERN"
    const signGallows = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.2), timberDarkMat);
    signGallows.position.set(2.4, 3.3, 7.5);
    tavernGroup.add(signGallows);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 1.2), timberDarkMat);
    signBoard.position.set(2.4, 2.7, 7.5);
    signBoard.castShadow = true;
    tavernGroup.add(signBoard);

    // 8. Interactive Bounty Notice Board on Porch (Standing at x = -3.2, z = 6.2)
    const boardEaselL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.0, 0.1), timberDarkMat);
    boardEaselL.position.set(-3.7, 1.5, 6.2);
    tavernGroup.add(boardEaselL);

    const boardEaselR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.0, 0.1), timberDarkMat);
    boardEaselR.position.set(-2.7, 1.5, 6.2);
    tavernGroup.add(boardEaselR);

    const boardPanel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 0.1), timberDarkMat);
    boardPanel.position.set(-3.2, 1.65, 6.2);
    tavernGroup.add(boardPanel);

    // Pinned Bounty Quest Parchment (Glowing softly)
    const questParchment = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), parchmentMat);
    questParchment.position.set(-3.2, 1.65, 6.27);
    tavernGroup.add(questParchment);

    // 9. Outdoor Tavern Furnishings: Cider Barrels & Picnic Tables
    // 3 Oak Cider Barrels stacked at West porch corner
    [[-4.2, 5.0, 0], [-4.2, 6.0, 0], [-4.2, 5.5, 0.85]].forEach(([bx, bz, by]) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.95, 10), barrelWoodMat);
      barrel.position.set(bx, 1.05 + by, bz);
      barrel.castShadow = true;
      tavernGroup.add(barrel);
    });

    // Picnic Bench on East Porch
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.9), woodDeckMat);
    tableTop.position.set(3.4, 1.25, 6.0);
    tableTop.castShadow = true;
    tavernGroup.add(tableTop);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.35), woodDeckMat);
    bench.position.set(3.4, 0.95, 6.7);
    tavernGroup.add(bench);

    return { tavernGroup, doorHingeGroup };
  }
}
