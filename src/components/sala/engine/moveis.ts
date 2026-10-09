import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { rng, type Mats } from "./materiais";

export const PE_DIREITO = 2.8;

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

/**
 * Fábrica de móveis. Cada função devolve um grupo com a origem no chão, no
 * ponto de referência do móvel. A "frente" nativa de cada móvel está indicada
 * no comentário; o layout gira o grupo para a orientação desejada.
 */
export function criarFabrica(mats: Mats) {
  function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D, shadow = true) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const B = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D, r = 0) =>
    mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
  const C = (rt: number, rb: number, h: number, mat: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D, seg = 20) =>
    mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
  function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material, parent: THREE.Object3D, seg = 10) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = mesh(new THREE.CylinderGeometry(r, r, len, seg), mat, 0, 0, 0, parent);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  }

  /** Frente para -z (o encosto fica em +z). */
  function sofa() {
    const g = new THREE.Group();
    const w = 1.9, d = 0.88;
    B(w, 0.3, d, mats.corino, 0, 0.24, 0, g, 0.04);
    [-1, 0, 1].forEach((i) => B(0.54, 0.14, 0.62, mats.corinoCushion, i * 0.555, 0.46, -0.08, g, 0.05));
    B(w, 0.55, 0.2, mats.corino, 0, 0.62, 0.34, g, 0.05);
    [-1, 0, 1].forEach((i) => {
      const c = B(0.54, 0.4, 0.15, mats.corinoCushion, i * 0.555, 0.72, 0.19, g, 0.05);
      c.rotation.x = 0.13;
    });
    [-1, 1].forEach((s) => B(0.14, 0.5, d, mats.corino, s * (w / 2 - 0.07), 0.36, 0, g, 0.04));
    [[-0.85, -0.36], [0.85, -0.36], [-0.85, 0.36], [0.85, 0.36]].forEach(([fx, fz]) => C(0.025, 0.02, 0.09, mats.walnut, fx, 0.045, fz, g, 10));
    return g;
  }

  /** Frente para -z (apoio de pés em -z). */
  function poltrona() {
    const g = new THREE.Group();
    const m = mats.camel;
    B(0.78, 0.32, 0.8, m, 0, 0.24, 0, g, 0.05);
    B(0.56, 0.13, 0.62, m, 0, 0.45, -0.05, g, 0.05);
    const back = B(0.62, 0.72, 0.2, m, 0, 0.8, 0.36, g, 0.06);
    back.rotation.x = 0.34;
    B(0.4, 0.18, 0.12, m, 0, 1.18, 0.5, g, 0.05).rotation.x = 0.34;
    [-1, 1].forEach((s) => B(0.12, 0.55, 0.8, m, s * 0.36, 0.42, 0, g, 0.05));
    const foot = B(0.5, 0.08, 0.42, m, 0, 0.34, -0.6, g, 0.035);
    foot.rotation.x = 0.15;
    rod(V(0, 0.22, -0.4), V(0, 0.32, -0.55), 0.015, mats.metal, g);
    return g;
  }

  /** Frente para +z, encostada na parede N. */
  function tv() {
    const g = new THREE.Group();
    B(1.8, 0.38, 0.42, mats.oak, 0, 0.27, 0, g, 0.012);
    [-0.6, 0, 0.6].forEach((sx) => B(0.006, 0.3, 0.004, mats.oakDark, sx, 0.27, 0.212, g));
    [[-0.82, -0.16], [0.82, -0.16], [-0.82, 0.16], [0.82, 0.16]].forEach(([fx, fz]) => C(0.02, 0.02, 0.08, mats.metal, fx, 0.04, fz, g, 10));
    const back = B(2.5, 2.45, 0.02, mats.oakDark, 0, 1.27, -0.205, g);
    back.castShadow = false;
    for (let i = 0; i < 31; i++) B(0.045, 2.45, 0.03, mats.slat, -1.2 + i * 0.08, 1.27, -0.18, g);
    const glow = mesh(new THREE.PlaneGeometry(1.2, 0.76), mats.ledStrip, 0, 1.22, -0.164, g, false);
    glow.receiveShadow = false;
    glow.userData.brilho = true;
    B(0.97, 0.565, 0.035, mats.black, 0, 1.22, -0.145, g, 0.008);
    mesh(new THREE.PlaneGeometry(0.94, 0.53), mats.screen, 0, 1.22, -0.126, g, false);
    return g;
  }

  /** Apoiado em cima do rack da TV (a 0,65 m à direita do centro do rack). */
  function wifi() {
    const g = new THREE.Group();
    B(0.2, 0.035, 0.13, mats.white, 0, 0.478, 0, g, 0.01);
    rod(V(-0.07, 0.49, -0.05), V(-0.085, 0.66, -0.06), 0.006, mats.black, g);
    rod(V(0.07, 0.49, -0.05), V(0.085, 0.66, -0.06), 0.006, mats.black, g);
    [-0.05, -0.02, 0.01].forEach((lx) => B(0.008, 0.006, 0.004, mats.ledGreen, lx, 0.48, 0.066, g));
    return g;
  }

  function pufe(variante?: string) {
    const g = new THREE.Group();
    const s = mesh(new THREE.SphereGeometry(0.36, 28, 18), variante === "ocre" ? mats.ochre : mats.sage, 0, 0.215, 0, g);
    s.scale.set(1, 0.62, 1);
    return g;
  }

  /** Mesa redonda com tabuleiro de xadrez e quatro bancos. */
  function jogos() {
    const g = new THREE.Group();
    B(0.9, 0.04, 0.9, mats.oak, 0, 0.74, 0, g, 0.01);
    const board = mesh(new THREE.PlaneGeometry(0.62, 0.62), mats.chess, 0, 0.7605, 0, g, false);
    board.rotation.x = -Math.PI / 2;
    C(0.05, 0.05, 0.7, mats.metal, 0, 0.37, 0, g);
    C(0.28, 0.3, 0.03, mats.metal, 0, 0.015, 0, g, 28);
    ([[-0.19, -0.23, 1], [-0.04, -0.27, 1], [0.12, -0.19, 1], [0.04, 0.2, 0], [-0.12, 0.27, 0], [0.2, 0.12, 0]] as const).forEach(([bx, bz, claro]) => {
      C(0.018, 0.022, 0.045, claro ? mats.piece : mats.pieceDark, bx, 0.785, bz, g, 14);
    });
    [[0.62, 0], [-0.62, 0], [0, 0.62], [0, -0.62]].forEach(([sx, sz]) => {
      C(0.17, 0.17, 0.05, mats.stoolTop, sx, 0.46, sz, g, 24);
      C(0.022, 0.022, 0.42, mats.metal, sx, 0.23, sz, g, 10);
      C(0.14, 0.15, 0.02, mats.metal, sx, 0.01, sz, g, 20);
    });
    return g;
  }

  /** Quem usa olha para -z (o painel fica em -z). */
  function esteira() {
    const g = new THREE.Group();
    B(0.74, 0.16, 1.7, mats.metal, 0, 0.1, 0, g, 0.03);
    B(0.5, 0.012, 1.45, mats.black, 0, 0.186, 0.05, g);
    [-1, 1].forEach((s) => B(0.1, 0.02, 1.5, mats.steel, s * 0.31, 0.185, 0.05, g));
    B(0.74, 0.14, 0.28, mats.metal, 0, 0.2, -0.73, g, 0.03);
    [-1, 1].forEach((s) => rod(V(s * 0.33, 0.22, -0.78), V(s * 0.33, 1.25, -0.6), 0.03, mats.metal, g, 14));
    const cons = B(0.72, 0.22, 0.14, mats.black, 0, 1.32, -0.6, g, 0.03);
    cons.rotation.x = -0.55;
    const disp = mesh(new THREE.PlaneGeometry(0.3, 0.1), mats.display, 0, 0.02, 0.071, cons, false);
    disp.receiveShadow = false;
    [-1, 1].forEach((s) => rod(V(s * 0.33, 1.08, -0.62), V(s * 0.33, 1.05, -0.22), 0.016, mats.steel, g, 10));
    return g;
  }

  /** Quem pedala olha para -z (o guidão fica em -z). */
  function bike() {
    const g = new THREE.Group();
    B(0.55, 0.05, 0.07, mats.metal, 0, 0.035, -0.45, g, 0.02);
    B(0.55, 0.05, 0.07, mats.metal, 0, 0.035, 0.42, g, 0.02);
    B(0.07, 0.07, 0.95, mats.metal, 0, 0.09, 0, g, 0.02);
    const fw = C(0.25, 0.25, 0.06, mats.steel, 0, 0.36, -0.32, g, 36);
    fw.rotation.z = Math.PI / 2;
    const hub = C(0.06, 0.06, 0.08, mats.metal, 0, 0.36, -0.32, g, 16);
    hub.rotation.z = Math.PI / 2;
    rod(V(0, 0.1, -0.4), V(0, 1.02, -0.18), 0.035, mats.metal, g, 12);
    rod(V(0, 0.1, 0.05), V(0, 0.88, 0.3), 0.035, mats.metal, g, 12);
    rod(V(0, 0.4, -0.05), V(0, 0.36, -0.3), 0.03, mats.metal, g, 10);
    B(0.5, 0.035, 0.035, mats.black, 0, 1.04, -0.12, g, 0.015);
    [-1, 1].forEach((s) => rod(V(s * 0.24, 1.04, -0.12), V(s * 0.2, 1.08, 0.06), 0.017, mats.black, g, 10));
    B(0.16, 0.06, 0.27, mats.black, 0, 0.92, 0.36, g, 0.03);
    const crank = C(0.075, 0.075, 0.02, mats.steel, 0.07, 0.36, -0.06, g, 20);
    crank.rotation.z = Math.PI / 2;
    B(0.09, 0.02, 0.05, mats.black, 0.13, 0.26, -0.02, g);
    B(0.09, 0.02, 0.05, mats.black, -0.13, 0.46, -0.1, g);
    return g;
  }

  /** Frente para -z (apoio de pernas em -z). */
  function massagem() {
    const g = new THREE.Group();
    B(0.82, 0.4, 0.88, mats.shell, 0, 0.24, 0.05, g, 0.08);
    B(0.54, 0.14, 0.6, mats.fabricDark, 0, 0.49, -0.02, g, 0.05);
    const back = B(0.66, 0.95, 0.28, mats.shell, 0, 0.95, 0.4, g, 0.08);
    back.rotation.x = 0.3;
    B(0.5, 0.82, 0.06, mats.fabricDark, 0, 0, -0.14, back, 0.025);
    B(0.4, 0.2, 0.12, mats.fabricDark, 0, 0.52, -0.1, back, 0.05);
    [-1, 1].forEach((s) => B(0.15, 0.5, 0.84, mats.shell, s * 0.37, 0.52, 0.04, g, 0.06));
    const leg = B(0.48, 0.5, 0.22, mats.shell, 0, 0.27, -0.5, g, 0.06);
    leg.rotation.x = 0.42;
    B(0.38, 0.42, 0.04, mats.fabricDark, 0, 0.02, -0.12, leg, 0.015);
    return g;
  }

  /** Frente para +z, encostada na parede pelo fundo (-z). Largura de 1,0 m. */
  function estante() {
    const g = new THREE.Group();
    const w = 1.0, h = 1.9, d = 0.32;
    [-1, 1].forEach((s) => B(0.025, h, d, mats.oak, s * (w / 2 - 0.0125), h / 2, 0, g));
    const nivel = [0.03, 0.41, 0.79, 1.17, 1.55, 1.885];
    nivel.forEach((y) => B(w, 0.025, d, mats.oak, 0, y, 0, g));
    B(w, h, 0.01, mats.oakDark, 0, h / 2, -d / 2 + 0.005, g);
    const R = rng(42);
    const paleta = [0x7a3e3e, 0x3e5a7a, 0x5e7a3e, 0xc2a15a, 0x8c6b9c, 0xd9d2c3, 0x2f4f4f, 0xb5653f, 0x41566b, 0xa08d6b];
    const livros: { x: number; y: number; w: number; h: number; d: number; c: number }[] = [];
    nivel.slice(0, 5).forEach((y, si) => {
      let x = -0.47;
      while (x < 0.44) {
        const bw = 0.022 + R() * 0.03, bh = 0.2 + R() * 0.12, bd = 0.19 + R() * 0.06;
        if (si === 2 && x > 0.12 && x < 0.32) { x += 0.2; continue; }
        if (R() < 0.06) { x += 0.05; continue; }
        livros.push({ x: x + bw / 2, y: y + 0.0125 + bh / 2, w: bw, h: bh, d: bd, c: paleta[(R() * paleta.length) | 0] });
        x += bw + 0.002;
      }
    });
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mats.bookInst, livros.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), cor = new THREE.Color();
    livros.forEach((b, i) => {
      m4.compose(V(b.x, b.y, -0.01), q, V(b.w, b.h, b.d));
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, cor.set(b.c));
    });
    inst.castShadow = true;
    inst.receiveShadow = true;
    g.add(inst);
    return g;
  }

  /** Luminária de piso. A luz quente (relaxamento) nasce em `userData.luz`. */
  function luminaria() {
    const g = new THREE.Group();
    C(0.15, 0.16, 0.025, mats.metal, 0, 0.0125, 0, g, 28);
    rod(V(0, 0.02, 0), V(0, 1.62, 0), 0.012, mats.metal, g);
    rod(V(0, 1.62, 0), V(0.32, 1.66, 0.42), 0.01, mats.metal, g);
    const shade = mesh(new THREE.CylinderGeometry(0.07, 0.15, 0.17, 28, 1, true), mats.lampShade, 0.36, 1.58, 0.47, g);
    shade.castShadow = false;
    g.userData.luz = V(0.36, 1.5, 0.47);
    return g;
  }

  /** Plantas. Variantes: "jardim" (painel na parede, frente -z), "arália" e "zamioculca" (vasos). */
  function plantas(variante?: string) {
    const g = new THREE.Group();
    const R = rng(variante === "jardim" ? 5 : variante === "zamioculca" ? 9 : 13);
    const cor = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const verdes = [0x3e7b47, 0x2f6a3a, 0x5c9152, 0x497f3e, 0x6fa05e, 0x2b5a33];
    if (variante === "jardim") {
      B(1.12, 1.24, 0.05, mats.oakDark, 0, 1.55, 0.02, g);
      const n = 150;
      const folhas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075, 0), mats.leafInst, n);
      for (let i = 0; i < n; i++) {
        const s = 0.7 + R() * 0.75;
        m4.compose(V((R() - 0.5) * 1.02, 0.98 + R() * 1.14, -0.03 - R() * 0.06), q.setFromEuler(e.set(R() * 3, R() * 3, R() * 3)), V(s, s * 0.8, s));
        folhas.setMatrixAt(i, m4);
        folhas.setColorAt(i, cor.set(verdes[(R() * verdes.length) | 0]));
      }
      folhas.castShadow = true;
      g.add(folhas);
    } else if (variante === "zamioculca") {
      C(0.14, 0.11, 0.27, mats.terracotta, 0, 0.135, 0, g, 24);
      C(0.13, 0.13, 0.01, mats.soil, 0, 0.27, 0, g, 20);
      const folhas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 6), mats.leafInst, 72);
      let k = 0;
      for (let s = 0; s < 9; s++) {
        const ang = (s / 9) * Math.PI * 2 + R() * 0.3, len = 0.45 + R() * 0.3, lean = 0.25 + R() * 0.3;
        const topo = V(Math.cos(ang) * lean * len, 0.27 + len, Math.sin(ang) * lean * len);
        rod(V(0, 0.27, 0), topo, 0.008, mats.stem, g, 6);
        for (let j = 0; j < 8; j++) {
          const p = V(0, 0.27, 0).lerp(topo, 0.3 + j * 0.09);
          const lado = j % 2 ? 1 : -1;
          p.x += Math.cos(ang + Math.PI / 2) * 0.035 * lado;
          p.z += Math.sin(ang + Math.PI / 2) * 0.035 * lado;
          m4.compose(p, q.setFromEuler(e.set(R() * 0.6, -ang, 0.4 * lado)), V(0.55, 0.22, 1.3));
          folhas.setMatrixAt(k, m4);
          folhas.setColorAt(k, cor.set(0x24502c));
          k++;
        }
      }
      folhas.castShadow = true;
      g.add(folhas);
    } else {
      C(0.17, 0.13, 0.34, mats.pot, 0, 0.17, 0, g, 28);
      C(0.155, 0.155, 0.01, mats.soil, 0, 0.335, 0, g, 24);
      const pontas = [V(0.05, 1.45, 0.02), V(-0.12, 1.2, 0.08), V(0.14, 1.05, -0.08)];
      pontas.forEach((t) => rod(V(0, 0.33, 0), t, 0.012, mats.stem, g, 6));
      const folhas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 10, 6), mats.leafInst, 90);
      for (let i = 0; i < 90; i++) {
        const t = pontas[i % 3], s = 0.8 + R() * 0.5;
        m4.compose(V(t.x + (R() - 0.5) * 0.5, t.y - 0.35 + R() * 0.5, t.z + (R() - 0.5) * 0.5), q.setFromEuler(e.set(R() - 0.5, R() * 3, R() - 0.5)), V(s, 0.32 * s, s));
        folhas.setMatrixAt(i, m4);
        folhas.setColorAt(i, cor.set(verdes[(R() * 3) | 0]));
      }
      folhas.castShadow = true;
      g.add(folhas);
    }
    return g;
  }

  /** Frente para +z, encostado na parede pelo fundo. Largura de 1,2 m. */
  function armarios() {
    const g = new THREE.Group();
    B(1.2, 1.85, 0.42, mats.locker, 0, 0.925, 0, g, 0.01);
    [-0.3, 0, 0.3].forEach((sx) => B(0.006, 1.8, 0.004, mats.seam, sx, 0.925, 0.212, g));
    B(1.18, 0.006, 0.004, mats.seam, 0, 0.95, 0.212, g);
    [-0.45, -0.15, 0.15, 0.45].forEach((sx) => {
      [0.95 + 0.84, 0.95 - 0.06].forEach((topoY) => {
        for (let v = 0; v < 4; v++) B(0.16, 0.008, 0.004, mats.seam, sx, topoY - 0.08 - v * 0.022, 0.213, g);
        B(0.02, 0.07, 0.02, mats.steel, sx + 0.11, topoY - 0.42, 0.22, g);
      });
    });
    return g;
  }

  /** Frente para +z. */
  function bebedouro() {
    const g = new THREE.Group();
    B(0.32, 1.0, 0.32, mats.white, 0, 0.5, 0, g, 0.02);
    B(0.2, 0.02, 0.1, mats.metal, 0, 0.7, 0.17, g);
    B(0.03, 0.05, 0.03, mats.steel, -0.05, 0.86, 0.175, g);
    B(0.03, 0.05, 0.03, mats.metal, 0.05, 0.86, 0.175, g);
    C(0.13, 0.13, 0.38, mats.water, 0, 1.2, 0, g, 28).castShadow = false;
    C(0.05, 0.05, 0.03, mats.water, 0, 1.405, 0, g, 16);
    return g;
  }

  /** Bancada com cuba, cafeteira e frigobar. Frente para +z, encostada pelo fundo. Largura de 1,9 m. */
  function copa() {
    const g = new THREE.Group();
    B(1.4, 0.86, 0.6, mats.oakDark, -0.2, 0.43, 0, g, 0.01);
    B(1.46, 0.04, 0.64, mats.counter, -0.2, 0.88, 0.01, g, 0.008);
    [-0.55, -0.2, 0.15].forEach((sx) => B(0.006, 0.7, 0.004, mats.seam, sx, 0.43, 0.302, g));
    [-0.72, -0.37, -0.02, 0.33].forEach((sx) => B(0.02, 0.12, 0.02, mats.steel, sx + 0.09, 0.7, 0.31, g));
    B(0.4, 0.012, 0.3, mats.metal, -0.52, 0.906, 0.02, g);
    rod(V(-0.52, 0.9, -0.2), V(-0.52, 1.1, -0.2), 0.012, mats.steel, g);
    rod(V(-0.52, 1.1, -0.2), V(-0.52, 1.12, -0.06), 0.01, mats.steel, g);
    B(0.26, 0.3, 0.3, mats.black, 0.2, 1.05, -0.12, g, 0.02);
    B(0.2, 0.04, 0.2, mats.steel, 0.2, 0.92, -0.12, g);
    B(0.05, 0.05, 0.02, mats.ledGreen, 0.2, 1.12, 0.045, g);
    B(0.5, 0.86, 0.5, mats.white, 0.75, 0.43, 0, g, 0.02);
    B(0.015, 0.4, 0.02, mats.steel, 0.99, 0.55, 0.255, g);
    return g;
  }

  /** Biombo de três painéis. Largura de 1,5 m, painéis levemente dobrados. */
  function biombo() {
    const g = new THREE.Group();
    [-1, 0, 1].forEach((i) => {
      const p = new THREE.Group();
      p.position.set(i * 0.48, 0, i === 0 ? 0 : 0.05);
      p.rotation.y = i * 0.28;
      B(0.5, 1.7, 0.03, mats.oakDark, 0, 0.9, 0, p, 0.006);
      B(0.4, 1.5, 0.036, mats.sage, 0, 0.9, 0, p, 0.004);
      g.add(p);
    });
    return g;
  }

  /** Frente para -z, encostado na parede S. */
  function ar() {
    const g = new THREE.Group();
    B(0.9, 0.28, 0.2, mats.white, 0, 2.42, 0, g, 0.04);
    B(0.78, 0.02, 0.01, mats.seam, 0, 2.31, -0.1, g);
    B(0.06, 0.012, 0.004, mats.ledGreen, 0.36, 2.38, -0.101, g);
    return g;
  }

  /** Frente para -z, na parede S. Folha de 0,88 x 2,10 m (vão livre da NBR 9050). */
  function porta() {
    const g = new THREE.Group();
    B(0.88, 2.1, 0.045, mats.walnut, 0, 1.05, 0, g, 0.006);
    [-1, 1].forEach((s) => B(0.06, 2.16, 0.06, mats.white, s * 0.47, 1.08, 0.005, g));
    B(1.0, 0.06, 0.06, mats.white, 0, 2.13, 0.005, g);
    B(0.13, 0.02, 0.02, mats.steel, -0.3, 1.02, -0.045, g, 0.008);
    C(0.025, 0.025, 0.02, mats.steel, -0.35, 1.02, -0.03, g, 14).rotation.x = Math.PI / 2;
    B(0.075, 0.17, 0.025, mats.black, -0.35, 1.2, -0.035, g, 0.006);
    const pad = mesh(new THREE.PlaneGeometry(0.05, 0.085), mats.keypad, -0.35, 1.215, -0.0485, g, false);
    pad.rotation.y = Math.PI;
    return g;
  }

  /** Sofá-cama tipo futon, fechado. Frente para -z (o encosto fica em +z). Largura de 1,9 m. */
  function sofacama() {
    const g = new THREE.Group();
    const w = 1.9, d = 0.9;
    [[-0.88, -0.38], [0.88, -0.38], [-0.88, 0.38], [0.88, 0.38]].forEach(([fx, fz]) => C(0.028, 0.024, 0.08, mats.walnut, fx, 0.04, fz, g, 10));
    B(w, 0.14, d - 0.04, mats.oakDark, 0, 0.15, 0, g, 0.02);
    [-1, 1].forEach((s) => B(0.06, 0.42, d - 0.04, mats.oak, s * (w / 2 - 0.03), 0.34, 0, g, 0.015));
    B(w - 0.14, 0.17, 0.66, mats.corino, 0, 0.3, -0.08, g, 0.06);
    const enc = B(w - 0.14, 0.6, 0.17, mats.corino, 0, 0.62, 0.3, g, 0.06);
    enc.rotation.x = 0.24;
    const travesseiro = B(0.46, 0.13, 0.3, mats.sage, -0.58, 0.44, 0.08, g, 0.05);
    travesseiro.rotation.set(-0.5, 0.15, 0);
    B(0.5, 0.07, 0.38, mats.ochre, 0.55, 0.42, -0.05, g, 0.02);
    return g;
  }

  /**
   * Rede presa em dois ganchos de parede. O eixo x local liga os ganchos;
   * `vao` é a distância entre eles (a rede fica na diagonal de um canto).
   */
  function rede(vao = 3.0) {
    const g = new THREE.Group();
    const semi = 1.1, meio = 0.45, baixo = 0.5, ponta = 1.02, gancho = 1.75;
    const nu = 32, nv = 10;
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= nu; i++) {
      const u = -1 + (2 * i) / nu;
      const larg = meio * Math.sqrt(Math.max(0, 1 - u * u)) + 0.03;
      for (let j = 0; j <= nv; j++) {
        const v = -1 + (2 * j) / nv;
        pos.push(u * semi, baixo + (ponta - baixo) * u * u + 0.13 * v * v * (1 - u * u), v * larg);
        uv.push(i / nu, j / nv);
      }
    }
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = i * (nv + 1) + j, b = a + nv + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    mesh(geo, mats.rede, 0, 0, 0, g);
    [-1, 1].forEach((s) => {
      const fim = V(s * (semi + 0.02), ponta, 0);
      const gx = s * vao / 2;
      [-0.04, 0, 0.04].forEach((dz) => rod(V(fim.x, fim.y, dz), V(gx - s * 0.05, gancho - 0.04, 0), 0.006, mats.rope, g, 6));
      B(0.02, 0.12, 0.08, mats.steel, gx - s * 0.01, gancho, 0, g, 0.006);
      const anel = mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 16), mats.steel, gx - s * 0.05, gancho - 0.02, 0, g);
      anel.rotation.y = Math.PI / 2;
    });
    return g;
  }

  /** Mesa lateral com base de carregamento e dois celulares. Frente para -z. */
  function recarga() {
    const g = new THREE.Group();
    C(0.17, 0.19, 0.02, mats.metal, 0, 0.01, 0, g, 24);
    C(0.025, 0.025, 0.52, mats.metal, 0, 0.28, 0, g, 12);
    B(0.45, 0.03, 0.45, mats.oak, 0, 0.555, 0, g, 0.012);
    B(0.28, 0.045, 0.13, mats.black, 0, 0.592, 0.02, g, 0.012);
    B(0.22, 0.006, 0.004, mats.ledGreen, 0, 0.594, -0.046, g);
    [-0.065, 0.065].forEach((sx) => {
      const cel = new THREE.Group();
      cel.position.set(sx, 0.69, 0.03);
      cel.rotation.x = 0.28;
      g.add(cel);
      B(0.075, 0.155, 0.009, mats.black, 0, 0, 0, cel, 0.006);
      const tela = mesh(new THREE.PlaneGeometry(0.065, 0.135), mats.display, 0, 0, -0.0051, cel, false);
      tela.rotation.y = Math.PI;
    });
    rod(V(0, 0.58, 0.09), V(0, 0.05, 0.12), 0.004, mats.black, g, 6);
    return g;
  }

  /** Painel de LED embutido no forro. */
  function luz() {
    const g = new THREE.Group();
    const p = mesh(new THREE.PlaneGeometry(0.62, 0.62), mats.panel, 0, PE_DIREITO - 0.004, 0, g, false);
    p.rotation.x = Math.PI / 2;
    return g;
  }

  return { sofa, poltrona, tv, wifi, pufe, jogos, esteira, bike, massagem, estante, luminaria, plantas, armarios, bebedouro, copa, biombo, ar, porta, luz, sofacama, rede, recarga };
}

export type Fabrica = ReturnType<typeof criarFabrica>;
