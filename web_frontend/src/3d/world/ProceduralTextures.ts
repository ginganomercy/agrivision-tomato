/**
 * ProceduralTextures - On-Demand HTML5 Canvas PBR Texture Generator
 * Generates ultra-crisp procedural textures in memory with zero network overhead (0 KB download),
 * instant cross-platform compatibility, and full Three.js CanvasTexture integration.
 */
import * as THREE from 'three';

export class ProceduralTextures {
  /**
   * Generates a warm medieval polished oak parquet floor texture
   * Features individual horizontal planks, subtle grain noise, recessed bevel joints, and brass nail accents.
   */
  public static createWoodPlankTexture(width = 512, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base background
    ctx.fillStyle = '#2c190d';
    ctx.fillRect(0, 0, width, height);

    const plankRows = 8;
    const rowHeight = height / plankRows;
    const cols = 4;

    const baseTones = ['#462712', '#3f220f', '#4b2a14', '#391d0c', '#4e2d17'];

    for (let r = 0; r < plankRows; r++) {
      const y = r * rowHeight;
      const xOffset = (r % 2) * (width / cols / 2);
      const colWidth = width / cols;

      for (let c = -1; c <= cols + 1; c++) {
        const x = c * colWidth + xOffset;
        const toneIndex = Math.abs((r * 3 + c * 7) % baseTones.length);
        ctx.fillStyle = baseTones[toneIndex];
        ctx.fillRect(x + 2, y + 2, colWidth - 4, rowHeight - 4);

        // Subtle wood grain horizontal lines
        ctx.strokeStyle = 'rgba(25, 12, 5, 0.18)';
        ctx.lineWidth = 1.5;
        for (let g = 6; g < rowHeight - 6; g += 6 + (g % 4)) {
          ctx.beginPath();
          ctx.moveTo(x + 4, y + g);
          ctx.bezierCurveTo(
            x + colWidth * 0.33, y + g + (Math.sin(r + g) * 2),
            x + colWidth * 0.66, y + g - (Math.cos(c + g) * 2),
            x + colWidth - 4, y + g
          );
          ctx.stroke();
        }

        // Brass nail heads on plank ends
        ctx.fillStyle = 'rgba(195, 155, 60, 0.4)';
        ctx.beginPath();
        ctx.arc(x + 8, y + rowHeight / 2, 2.5, 0, Math.PI * 2);
        ctx.arc(x + colWidth - 8, y + rowHeight / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Dark bevel border shadows
        ctx.strokeStyle = '#1b0e06';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x + 1, y + 1, colWidth - 2, rowHeight - 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    return texture;
  }

  /**
   * Generates a dressed medieval fieldstone wall texture with mortar lines for the hearth
   */
  public static createStoneWallTexture(width = 512, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Dark mortar background
    ctx.fillStyle = '#26221d';
    ctx.fillRect(0, 0, width, height);

    const rows = 8;
    const rowH = height / rows;
    const stoneTones = ['#544d44', '#60574d', '#49423b', '#6b6256', '#524b42'];

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const cols = 5;
      const colW = width / cols;
      const shift = (r % 2) * (colW / 2);

      for (let c = -1; c <= cols + 1; c++) {
        const x = c * colW + shift;
        const tone = stoneTones[Math.abs((r * 2 + c * 5) % stoneTones.length)];
        ctx.fillStyle = tone;

        // Rounded stone block
        const pad = 4;
        ctx.beginPath();
        ctx.roundRect(x + pad, y + pad, colW - pad * 2, rowH - pad * 2, 6);
        ctx.fill();

        // Texture noise / highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(x + pad + 2, y + pad + 2, colW - pad * 2 - 4, (rowH - pad * 2) * 0.4, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.roundRect(x + pad + 2, y + rowH * 0.5, colW - pad * 2 - 4, (rowH - pad * 2) * 0.4, 4);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  /**
   * Generates an ornate royal crimson & gold guild carpet runner
   */
  public static createOrnateCarpetTexture(width = 512, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep crimson velvet base
    ctx.fillStyle = '#681313';
    ctx.fillRect(0, 0, width, height);

    // Ornate gold border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, width - 36, height - 36);

    ctx.strokeStyle = '#8b2020';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Center ornate diamond guild crest pattern
    const midX = width / 2;
    const midY = height / 2;

    ctx.fillStyle = '#4a0b0b';
    ctx.beginPath();
    ctx.moveTo(midX, 60);
    ctx.lineTo(width - 60, midY);
    ctx.lineTo(midX, height - 60);
    ctx.lineTo(60, midY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Center Golden Tomato Emblem
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(midX, midY, 52, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#681313';
    ctx.beginPath();
    ctx.arc(midX, midY, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e6c35c';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍅', midX, midY - 2);

    // Decorative corner rosettes
    const corners = [
      [30, 30],
      [width - 30, 30],
      [30, height - 30],
      [width - 30, height - 30]
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);
    return texture;
  }

  /**
   * Generates a vintage parchment notice board filled with authentic wanted posters & guild stamps
   */
  public static createBountyNoticeBoardTexture(width = 512, height = 256): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Dark cork/timber board background
    ctx.fillStyle = '#3a2012';
    ctx.fillRect(0, 0, width, height);

    // Heavy wooden frame
    ctx.strokeStyle = '#221208';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Poster 1: Hornworm Beast (Left)
    this.drawWantedPoster(
      ctx,
      28, 24, 138, 206,
      'WANTED',
      '🐛 HORNWORM',
      'BOUNTY: 300G',
      '#e8dab5',
      '#991b1b'
    );

    // Poster 2: Center Grand Harvest Notice
    this.drawWantedPoster(
      ctx,
      184, 20, 144, 214,
      'SERIKAT TANI',
      '🌾 BURSA PANEN',
      'SAN MARZANO',
      '#f4edd6',
      '#166534'
    );

    // Poster 3: Blight Beetle (Right)
    this.drawWantedPoster(
      ctx,
      344, 24, 140, 206,
      'WANTED',
      '🪲 BLIGHT BEETLE',
      'BOUNTY: 500G',
      '#e6d8b0',
      '#991b1b'
    );

    return new THREE.CanvasTexture(canvas);
  }

  private static drawWantedPoster(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    header: string,
    target: string,
    bounty: string,
    paperColor: string,
    accentColor: string
  ): void {
    // Parchment paper with slight shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 4, y + 4, w, h);

    ctx.fillStyle = paperColor;
    ctx.fillRect(x, y, w, h);

    // Wooden pushpin
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 8, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Border line
    ctx.strokeStyle = '#6b4f34';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);

    // Header text
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(header, x + w / 2, y + 26);

    // Target box
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(x + 12, y + 36, w - 24, 88);
    ctx.strokeStyle = '#8c7355';
    ctx.strokeRect(x + 12, y + 36, w - 24, 88);

    // Sketch icon
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.fillText(target.split(' ')[0], x + w / 2, y + 90);

    // Target name
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(target.split(' ').slice(1).join(' '), x + w / 2, y + 144);

    // Bounty text
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(bounty, x + w / 2, y + 168);

    // Red wax guild stamp
    ctx.fillStyle = 'rgba(185, 28, 28, 0.75)';
    ctx.beginPath();
    ctx.arc(x + w - 22, y + h - 22, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('AGRI', x + w - 22, y + h - 18);
  }

  /**
   * Generates a warm leaded stained glass window texture with diamond lattice
   */
  public static createStainedGlassTexture(width = 256, height = 512): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Arched top gradient (warm amber sunlight)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#ffe89e');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dark iron lead diamond lattice
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3.5;

    const step = 32;
    for (let x = -height; x <= width + height; x += step) {
      // Diagonal 1
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();

      // Diagonal 2
      ctx.beginPath();
      ctx.moveTo(x + height, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Heavy stone window frame
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
