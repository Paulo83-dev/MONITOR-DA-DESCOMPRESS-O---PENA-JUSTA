import * as THREE from "three";

/** Gerador pseudoaleatório determinístico: a sala fica igual em todas as visitas. */
export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Desenho = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function texturaCanvas(w: number, h: number, desenhar: Desenho, anisotropia: number, repetir?: [number, number]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (ctx) desenhar(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropia;
  if (repetir) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repetir[0], repetir[1]);
  }
  return t;
}

/** Piso vinílico amadeirado. `repetir` ajusta a escala ao tamanho da sala. */
export function texturaPiso(anisotropia: number, repetir: [number, number]) {
  return texturaCanvas(1024, 1024, (x, w, h) => {
    const R = rng(7);
    const cols = 8;
    const pw = w / cols;
    x.fillStyle = "#B98F64";
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < cols; i++) {
      let y = -R() * h * 0.6;
      while (y < h) {
        const len = h * (0.42 + R() * 0.5);
        x.fillStyle = `hsl(${29 + R() * 6} ${32 + R() * 12}% ${55 + R() * 9}%)`;
        x.fillRect(i * pw, y, pw, len);
        for (let g = 0; g < 16; g++) {
          x.strokeStyle = `rgba(96,62,32,${0.05 + R() * 0.09})`;
          x.lineWidth = 0.8 + R() * 1.6;
          const gx = i * pw + R() * pw;
          x.beginPath();
          x.moveTo(gx, y);
          for (let yy = y; yy <= y + len; yy += 32) x.lineTo(gx + Math.sin(yy * 0.012 + g) * 3.5 + (R() - 0.5) * 1.5, yy);
          x.stroke();
        }
        x.fillStyle = "rgba(58,38,22,.55)";
        x.fillRect(i * pw, y + len - 2, pw, 2);
        y += len;
      }
      x.fillStyle = "rgba(58,38,22,.6)";
      x.fillRect(i * pw, 0, 2, h);
    }
  }, anisotropia, repetir);
}

function texturaBorracha(anisotropia: number) {
  return texturaCanvas(512, 512, (x, w, h) => {
    x.fillStyle = "#3A4043";
    x.fillRect(0, 0, w, h);
    const R = rng(3);
    const cs = ["#4A5154", "#2C3133", "#5A6367", "#323739"];
    for (let i = 0; i < 6000; i++) {
      x.fillStyle = cs[(R() * 4) | 0];
      x.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2);
    }
  }, anisotropia, [3, 2]);
}

function texturaTabuleiro(anisotropia: number) {
  return texturaCanvas(256, 256, (x, w) => {
    const s = w / 8;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        x.fillStyle = (r + c) % 2 ? "#5A3F2C" : "#E9DEC6";
        x.fillRect(c * s, r * s, s, s);
      }
    }
  }, anisotropia);
}

function texturaTV(anisotropia: number) {
  return texturaCanvas(512, 288, (x, w, h) => {
    const R = rng(11);
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#79AFC2");
    g.addColorStop(0.58, "#F2D5B2");
    g.addColorStop(1, "#F2D5B2");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    const s = x.createRadialGradient(330, 150, 4, 330, 150, 70);
    s.addColorStop(0, "rgba(255,247,224,1)");
    s.addColorStop(1, "rgba(255,247,224,0)");
    x.fillStyle = s;
    x.fillRect(0, 0, w, h);
    const colinas: [string, number, number, number][] = [
      ["#93B8A8", 152, 18, 0.012],
      ["#62917F", 176, 22, 0.017],
      ["#40705F", 200, 14, 0.026],
    ];
    colinas.forEach(([col, base, amp, f], i) => {
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(0, h);
      for (let px = 0; px <= w; px += 8) x.lineTo(px, base + Math.sin(px * f + i * 1.7) * amp + Math.sin(px * f * 2.3 + i) * amp * 0.4);
      x.lineTo(w, h);
      x.closePath();
      x.fill();
    });
    const l = x.createLinearGradient(0, 222, 0, h);
    l.addColorStop(0, "#A2C8CF");
    l.addColorStop(1, "#6C9DAA");
    x.fillStyle = l;
    x.fillRect(0, 222, w, h - 222);
    x.strokeStyle = "rgba(255,250,235,.45)";
    for (let i = 0; i < 14; i++) {
      const yy = 229 + i * 4;
      x.beginPath();
      x.moveTo(300 - R() * 40, yy);
      x.lineTo(340 + R() * 40, yy);
      x.stroke();
    }
  }, anisotropia);
}

/** Pano de rede listrado. As listras correm no comprimento (eixo u). */
function texturaRede(anisotropia: number) {
  return texturaCanvas(256, 512, (x, w, h) => {
    const faixas = ["#E9DEC6", "#C0533A", "#E9DEC6", "#E2A93B", "#E9DEC6", "#3F7F6B", "#E9DEC6", "#C0533A", "#E9DEC6"];
    const larguras = [3, 1, 0.5, 1, 0.5, 1.4, 0.5, 1, 3];
    const total = larguras.reduce((a, b) => a + b, 0);
    let y = 0;
    faixas.forEach((cor, i) => {
      const fh = (larguras[i] / total) * h;
      x.fillStyle = cor;
      x.fillRect(0, y, w, fh + 1);
      y += fh;
    });
    x.strokeStyle = "rgba(60,40,25,.08)";
    for (let i = 0; i < w; i += 4) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i, h);
      x.stroke();
    }
  }, anisotropia);
}

export type Mats = ReturnType<typeof criarMateriais>;

export function criarMateriais(anisotropia: number, repetirPiso: [number, number]) {
  const std = (color: number, o: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });
  const tv = texturaTV(anisotropia);
  const m = {
    wall: std(0xbfd4e3, { roughness: 0.95 }),
    wallAccent: std(0xc9dec6, { roughness: 0.95 }),
    ceiling: std(0xf5f5f2, { roughness: 1 }),
    floor: std(0xffffff, { map: texturaPiso(anisotropia, repetirPiso), roughness: 0.6 }),
    base: std(0xf3f3f0, { roughness: 0.6 }),
    oak: std(0xc9a377, { roughness: 0.62 }),
    oakDark: std(0x8c6845, { roughness: 0.7 }),
    walnut: std(0x6c4a32, { roughness: 0.5 }),
    slat: std(0xb98e61, { roughness: 0.68 }),
    corino: std(0x3d5560, { roughness: 0.46 }),
    corinoCushion: std(0x48616d, { roughness: 0.52 }),
    camel: std(0x9a6a46, { roughness: 0.48 }),
    sage: std(0x8eae8a, { roughness: 0.95 }),
    ochre: std(0xc8a04c, { roughness: 0.95 }),
    stoolTop: std(0x5e7f86, { roughness: 0.7 }),
    metal: std(0x2b3134, { roughness: 0.4, metalness: 0.6 }),
    steel: std(0xb8c0c4, { roughness: 0.3, metalness: 0.85 }),
    black: std(0x16181a, { roughness: 0.35 }),
    shell: std(0xdad6cf, { roughness: 0.4 }),
    fabricDark: std(0x2f3639, { roughness: 0.6 }),
    rubber: std(0xffffff, { map: texturaBorracha(anisotropia), roughness: 0.95 }),
    white: std(0xf1f2f0, { roughness: 0.42 }),
    locker: std(0x8ba0aa, { roughness: 0.45, metalness: 0.35 }),
    seam: std(0x55666e, { roughness: 0.6 }),
    pot: std(0xd8d2c7, { roughness: 0.55 }),
    terracotta: std(0xb3684a, { roughness: 0.85 }),
    soil: std(0x3b2b20, { roughness: 1 }),
    stem: std(0x5b6b3a, { roughness: 0.8 }),
    counter: std(0xe6e1d6, { roughness: 0.35 }),
    leafInst: std(0xffffff, { roughness: 0.6 }),
    bookInst: std(0xffffff, { roughness: 0.75 }),
    water: std(0x9cc7e6, { roughness: 0.08, transparent: true, opacity: 0.6 }),
    chess: std(0xffffff, { map: texturaTabuleiro(anisotropia), roughness: 0.45 }),
    rede: std(0xffffff, { map: texturaRede(anisotropia), roughness: 0.95, side: THREE.DoubleSide }),
    rope: std(0xd9ccb0, { roughness: 0.9 }),
    piece: std(0xf0ede6, { roughness: 0.4 }),
    pieceDark: std(0x231c17, { roughness: 0.4 }),
    screen: new THREE.MeshStandardMaterial({ map: tv, emissive: 0xffffff, emissiveMap: tv, emissiveIntensity: 0.85, roughness: 0.25 }),
    panel: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.4, roughness: 1 }),
    lampShade: new THREE.MeshStandardMaterial({ color: 0xf4efe6, emissive: 0xffb060, emissiveIntensity: 0.05, roughness: 0.7, side: THREE.DoubleSide }),
    ledStrip: new THREE.MeshBasicMaterial({ color: 0xffb45c, transparent: true, opacity: 0 }),
    keypad: new THREE.MeshStandardMaterial({ color: 0x0b2a33, emissive: 0x3fd0c9, emissiveIntensity: 0.9 }),
    ledGreen: new THREE.MeshStandardMaterial({ color: 0x0e2a12, emissive: 0x47e36a, emissiveIntensity: 1 }),
    display: new THREE.MeshStandardMaterial({ color: 0x0b1f26, emissive: 0x4fa9c8, emissiveIntensity: 0.6 }),
  };
  Object.values(m).forEach((mat) => {
    if (mat instanceof THREE.MeshStandardMaterial) mat.envMapIntensity = 0.55;
  });
  return m;
}
