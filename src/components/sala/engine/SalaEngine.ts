import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ITEM_POR_ID, type AreaId, type ItemId } from "@/data/itens";
import { LAYOUTS, type Instancia, type Layout, type Parede, type Tamanho } from "@/data/layouts";
import { validarLayout } from "@/lib/sala/validarLayout";
import { criarMateriais, type Mats } from "./materiais";
import { criarFabrica, PE_DIREITO, type Fabrica } from "./moveis";

export type Vista = "geral" | AreaId | "planta";

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  viewer: HTMLElement;
  overlay: HTMLElement;
  tamanho: Tamanho;
  areas: Iterable<AreaId>;
  onSelect?: (id: ItemId | null) => void;
  onVista?: (v: Vista | null) => void;
  onWalk?: (on: boolean) => void;
  onReady?: () => void;
};

type Mov = {
  obj: THREE.Object3D;
  item: ItemId | null;
  area?: AreaId;
  parede?: Parede;
  areaOn: boolean;
};

type Hotspot = { id: ItemId; el: HTMLButtonElement; pos: THREE.Vector3 };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const fmt = (n: number) => n.toFixed(2).replace(".", ",");
const girarPara = (x: number, z: number, tx: number, tz: number) => Math.atan2(-(tx - x), -(tz - z));

export class SalaEngine {
  private o: EngineOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1.6, 0.05, 80);
  private controls: OrbitControls;
  private mats: Mats;
  private fabrica: Fabrica;
  private hemi = new THREE.HemisphereLight(0xeef4ff, 0xbfb39f, 1.15);
  private sun = new THREE.DirectionalLight(0xf7faff, 1.9);
  private sala: THREE.Group | null = null;
  private dimGroup: THREE.Group | null = null;
  private movs: Mov[] = [];
  private hotspots: Hotspot[] = [];
  private dimLabels: { pos: THREE.Vector3; el: HTMLElement }[] = [];
  private lampLights: THREE.PointLight[] = [];
  private tvLights: THREE.PointLight[] = [];
  private occluders: THREE.Object3D[] = [];
  private helpers: THREE.Box3Helper[] = [];
  private layout: Layout = LAYOUTS.compacta;
  private areas = new Set<AreaId>();
  private selected: ItemId | null = null;
  private lighting: "plantao" | "relax" = "plantao";
  private dimsOn = false;
  private hotspotsOn = true;
  private vw = 1;
  private vh = 1;
  private needsRender = true;
  private inView = true;
  private firstFrame = true;
  private disposed = false;
  private raf = 0;
  private last = performance.now();
  private tween: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; start: number; dur: number } | null = null;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  private walk = { on: false, yaw: 0, pitch: 0, keys: new Set<string>() };
  private down: { x: number; y: number; lx: number; ly: number; moved: boolean } | null = null;
  private ray = new THREE.Raycaster();
  private tmp = V();
  private dir = V();
  private ndc = new THREE.Vector2();
  private teardown: (() => void)[] = [];

  constructor(opts: EngineOptions) {
    this.o = opts;
    const { canvas, viewer } = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minDistance = 0.4;
    this.controls.maxDistance = 26;
    this.controls.screenSpacePanning = true;
    this.controls.addEventListener("change", () => {
      const t = this.controls.target;
      t.set(clamp(t.x, -this.layout.largura / 2, this.layout.largura / 2), clamp(t.y, 0, PE_DIREITO), clamp(t.z, -this.layout.profundidade / 2, this.layout.profundidade / 2));
      this.requestRender();
    });
    this.controls.addEventListener("start", () => {
      this.tween = null;
      this.o.onVista?.(null);
    });

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const aniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.mats = criarMateriais(aniso, [1, 1]);
    this.fabrica = criarFabrica(this.mats);

    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(viewer);
    this.io = new IntersectionObserver((es) => {
      this.inView = es[es.length - 1].isIntersecting;
      if (this.inView) this.requestRender();
    });
    this.io.observe(viewer);

    this.bindEvents();
    this.updateBackground();
    this.setLayout(opts.tamanho, opts.areas);
    this.irParaVista("geral", false);
    this.resize();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  /* ---------- API pública ---------- */

  setLayout(tamanho: Tamanho, areas: Iterable<AreaId>) {
    this.layout = LAYOUTS[tamanho];
    this.areas = new Set(areas);
    this.clearSelection(false);
    this.montarSala();
    this.o.onVista?.(null);
    this.requestRender();
  }

  setAreas(areas: Iterable<AreaId>) {
    this.areas = new Set(areas);
    for (const m of this.movs) m.areaOn = !m.area || this.areas.has(m.area);
    if (this.selected && !this.movs.some((m) => m.item === this.selected && m.areaOn)) this.clearSelection();
    this.requestRender();
  }

  setLighting(modo: "plantao" | "relax") {
    this.lighting = modo;
    const relax = modo === "relax";
    this.hemi.color.set(relax ? 0xffddb8 : 0xeef4ff);
    this.hemi.groundColor.set(relax ? 0x5a4a3a : 0xbfb39f);
    this.hemi.intensity = relax ? 0.4 : 1.15;
    this.sun.color.set(relax ? 0xffc890 : 0xf7faff);
    this.sun.intensity = relax ? 0.35 : 1.9;
    this.mats.panel.emissiveIntensity = relax ? 0.1 : 1.4;
    this.mats.lampShade.emissiveIntensity = relax ? 1.6 : 0.05;
    this.mats.ledStrip.opacity = relax ? 0.85 : 0;
    this.lampLights.forEach((l) => (l.intensity = relax ? 9 : 0));
    this.tvLights.forEach((l) => (l.intensity = relax ? 2.5 : 0));
    this.renderer.toneMappingExposure = relax ? 1.15 : 1.0;
    this.requestRender();
  }

  setWalls(modo: "pastel" | "neutro") {
    const pastel = modo === "pastel";
    this.mats.wall.color.set(pastel ? 0xbfd4e3 : 0xe9e7e2);
    this.mats.wallAccent.color.set(pastel ? 0xc9dec6 : 0xe2dfd8);
    this.requestRender();
  }

  setDims(on: boolean) {
    this.dimsOn = on;
    if (this.dimGroup) this.dimGroup.visible = on;
    this.dimLabels.forEach((d) => (d.el.hidden = !on));
    this.requestRender();
  }

  setHotspots(on: boolean) {
    this.hotspotsOn = on;
    this.o.overlay.classList.toggle("sem-marcadores", !on);
  }

  temArea(area: AreaId) {
    return this.layout.instancias.some((i) => i.area === area);
  }

  irParaVista(v: Vista, animar = true) {
    const pose = this.poseDaVista(v);
    if (!pose) return;
    this.voarPara(pose.pos, pose.tgt, animar ? 950 : 0);
    this.o.onVista?.(v);
  }

  selectItem(id: ItemId, voar = true) {
    const movs = this.movs.filter((m) => m.item === id && m.areaOn);
    if (!movs.length) return;
    this.limparRealce();
    for (const m of movs) {
      const box = new THREE.Box3().setFromObject(m.obj).expandByScalar(0.03);
      const h = new THREE.Box3Helper(box, 0xe09a2b);
      h.renderOrder = 15;
      this.scene.add(h);
      this.helpers.push(h);
    }
    this.selected = id;
    this.hotspots.forEach((h) => h.el.setAttribute("aria-pressed", String(h.id === id)));
    this.o.onSelect?.(id);
    if (voar) {
      const pose = this.poseDoItem(movs[0]);
      this.voarPara(pose.pos, pose.tgt, 950);
      this.o.onVista?.(null);
    }
    this.requestRender();
  }

  clearSelection(notificar = true) {
    this.limparRealce();
    this.selected = null;
    this.hotspots.forEach((h) => h.el.setAttribute("aria-pressed", "false"));
    if (notificar) this.o.onSelect?.(null);
    this.requestRender();
  }

  enterWalk() {
    this.tween = null;
    const { largura: W, profundidade: D } = this.layout;
    this.walk.on = true;
    this.controls.enabled = false;
    const p = this.camera.position.clone();
    if (Math.abs(p.x) < W / 2 - 0.25 && Math.abs(p.z) < D / 2 - 0.25 && p.y < PE_DIREITO - 0.2) {
      p.y = 1.62;
      this.camera.position.copy(p);
      this.camera.lookAt(this.controls.target.x, 1.2, this.controls.target.z);
    } else {
      // Logo depois da porta, olhando para dentro da sala.
      const porta = this.layout.instancias.find((i) => i.item === "porta");
      const px = porta ? porta.x - 0.2 : W / 2 - 1.1;
      this.camera.position.set(px, 1.62, D / 2 - 0.9);
      this.camera.lookAt(px - W * 0.35, 1.1, -D * 0.25);
    }
    const e = new THREE.Euler().setFromQuaternion(this.camera.quaternion, "YXZ");
    this.walk.yaw = e.y;
    this.walk.pitch = clamp(e.x, -1.1, 1.1);
    this.aplicarRotacaoAndar();
    this.o.viewer.classList.add("andando");
    this.o.onVista?.(null);
    this.o.onWalk?.(true);
    this.o.canvas.focus({ preventScroll: true });
    this.requestRender();
  }

  exitWalk() {
    if (!this.walk.on) return;
    this.walk.on = false;
    this.walk.keys.clear();
    this.camera.getWorldDirection(this.dir);
    this.controls.target.copy(this.camera.position).addScaledVector(this.dir, 1.6);
    this.controls.target.y = clamp(this.controls.target.y, 0.2, 2.6);
    this.camera.rotation.order = "XYZ";
    this.controls.enabled = true;
    this.controls.update();
    this.o.viewer.classList.remove("andando");
    this.o.onWalk?.(false);
    this.requestRender();
  }

  /** Aperta uma tecla de direção (usado pelo painel de toque). */
  andar(dir: "f" | "b" | "l" | "r", ativo: boolean) {
    if (ativo) this.walk.keys.add(dir);
    else this.walk.keys.delete(dir);
  }

  /**
   * Confere a planta com as áreas ligadas: sobreposição, folgas, porta, visada
   * da TV e rota de 0,90 m (ver `npm run validar`). Serve para ajustar os layouts.
   */
  verificarLayout() {
    const r = validarLayout(this.layout, this.areas);
    return [...r.problemas, ...r.avisos.map((a) => `aviso: ${a}`)];
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.teardown.forEach((f) => f());
    this.ro.disconnect();
    this.io.disconnect();
    this.controls.dispose();
    this.limparRealce();
    this.descartarSala();
    Object.values(this.mats).forEach((m) => {
      if ("map" in m && m.map) m.map.dispose();
      if ("emissiveMap" in m && m.emissiveMap) m.emissiveMap.dispose();
      m.dispose();
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  /* ---------- montagem da sala ---------- */

  private descartarSala() {
    if (this.sala) {
      this.scene.remove(this.sala);
      this.sala.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
      });
    }
    this.lampLights.forEach((l) => this.scene.remove(l));
    this.tvLights.forEach((l) => this.scene.remove(l));
    this.lampLights = [];
    this.tvLights = [];
    this.hotspots.forEach((h) => h.el.remove());
    this.dimLabels.forEach((d) => d.el.remove());
    this.hotspots = [];
    this.dimLabels = [];
    this.movs = [];
    this.occluders = [];
    this.sala = null;
    this.dimGroup = null;
  }

  private montarSala() {
    this.descartarSala();
    const { largura: W, profundidade: D } = this.layout;
    const H = PE_DIREITO;
    const sala = new THREE.Group();
    this.sala = sala;
    this.scene.add(sala);
    const f = this.fabrica;
    const mats = this.mats;

    if (mats.floor.map) mats.floor.map.repeat.set(W * 0.625, D * 0.625);

    const plano = (w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, rx: number, ry: number, pai: THREE.Object3D = sala) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, 0);
      m.receiveShadow = true;
      pai.add(m);
      return m;
    };
    plano(W, D, mats.floor, 0, 0, 0, -Math.PI / 2, 0);
    plano(W, D, mats.ceiling, 0, H, 0, Math.PI / 2, 0);
    plano(W, H, mats.wall, 0, H / 2, -D / 2, 0, 0);
    plano(W, H, mats.wall, 0, H / 2, D / 2, 0, Math.PI);
    plano(D, H, mats.wall, -W / 2, H / 2, 0, 0, Math.PI / 2);
    plano(D, H, mats.wall, W / 2, H / 2, 0, 0, -Math.PI / 2);

    // Faixa verde pastel atrás da área de jogos, na parede sul (sugestão da UFAL).
    const jogos = this.layout.instancias.filter((i) => i.item === "jogos");
    if (jogos.length) {
      const x0 = Math.min(...jogos.map((j) => j.x)) - 1.05;
      const x1 = Math.max(...jogos.map((j) => j.x)) + 1.05;
      plano(x1 - x0, H, mats.wallAccent, (x0 + x1) / 2, H / 2, D / 2 - 0.004, 0, Math.PI);
    }

    const rodape = (w: number, d: number, x: number, z: number, parede: Parede) => {
      const g = new THREE.Group();
      sala.add(g);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), mats.base);
      m.position.set(x, 0.04, z);
      m.receiveShadow = true;
      g.add(m);
      this.movs.push({ obj: g, item: null, parede, areaOn: true });
    };
    rodape(W, 0.016, 0, -D / 2 + 0.008, "N");
    rodape(W, 0.016, 0, D / 2 - 0.008, "S");
    rodape(0.016, D, -W / 2 + 0.008, 0, "W");
    rodape(0.016, D, W / 2 - 0.008, 0, "E");

    const t = this.layout.tapete;
    if (t) {
      const g = new THREE.Group();
      sala.add(g);
      plano(t.w, t.d, mats.rubber, t.x, 0.004, t.z, -Math.PI / 2, 0, g);
      this.movs.push({ obj: g, item: null, area: "exercicio", areaOn: this.areas.has("exercicio") });
    }

    const feitos = new Set<ItemId>();
    for (const inst of this.layout.instancias) {
      const obj = this.criarItem(inst, f);
      if (!obj) continue;
      obj.position.set(inst.x, 0, inst.z);
      obj.rotation.y = inst.olhar ? girarPara(inst.x, inst.z, inst.olhar[0], inst.olhar[1]) : (inst.rot ?? 0);
      obj.userData.itemId = inst.item;
      sala.add(obj);
      const mov: Mov = { obj, item: inst.item, area: inst.area, parede: inst.parede, areaOn: !inst.area || this.areas.has(inst.area) };
      this.movs.push(mov);

      if (inst.item === "luminaria") {
        const luz = new THREE.PointLight(0xffb868, 0, 4.5, 2);
        luz.position.copy((obj.userData.luz as THREE.Vector3).clone().applyEuler(obj.rotation).add(obj.position));
        this.scene.add(luz);
        this.lampLights.push(luz);
      }
      if (inst.item === "tv") {
        const luz = new THREE.PointLight(0xffb46a, 0, 3, 2);
        luz.position.set(inst.x, 1.25, inst.z + 0.35);
        this.scene.add(luz);
        this.tvLights.push(luz);
      }
      if (!feitos.has(inst.item)) {
        feitos.add(inst.item);
        const alt = ITEM_POR_ID[inst.item].alturaMarcador;
        this.criarMarcador(inst.item, V(inst.x, alt, inst.z));
      }
    }

    // Cotas (ficam ocultas até o visitante ligar "Medidas").
    const dims = new THREE.Group();
    dims.visible = this.dimsOn;
    sala.add(dims);
    this.dimGroup = dims;
    const mat = new THREE.LineBasicMaterial({ color: 0xd58f25, depthTest: false, transparent: true });
    const cota = (a: THREE.Vector3, b: THREE.Vector3, tick: THREE.Vector3, texto: string) => {
      const pts = [a, b, a.clone().sub(tick), a.clone().add(tick), b.clone().sub(tick), b.clone().add(tick)];
      const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
      l.renderOrder = 20;
      dims.add(l);
      this.criarRotuloCota(a.clone().lerp(b, 0.5), texto);
    };
    cota(V(-W / 2, 0.01, D / 2 + 0.3), V(W / 2, 0.01, D / 2 + 0.3), V(0, 0, 0.1), `${fmt(W)} m`);
    cota(V(W / 2 + 0.3, 0.01, -D / 2), V(W / 2 + 0.3, 0.01, D / 2), V(0.1, 0, 0), `${fmt(D)} m`);
    cota(V(W / 2 + 0.2, 0, D / 2 + 0.2), V(W / 2 + 0.2, H, D / 2 + 0.2), V(0.1, 0, 0), `pé-direito ${fmt(H)} m`);
    this.criarRotuloCota(V(0, 0.02, 0), `área ${this.layout.area} m²`);

    // Iluminação e sombras acompanham o tamanho da sala.
    this.sun.position.set(W * 0.23, 7, D * 0.55);
    this.sun.target.position.set(0, 0, 0);
    const sc = this.sun.shadow.camera;
    sc.left = -(W / 2 + 0.8);
    sc.right = W / 2 + 0.8;
    sc.top = D / 2 + 0.8;
    sc.bottom = -(D / 2 + 0.8);
    sc.near = 1;
    sc.far = 16;
    sc.updateProjectionMatrix();
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;

    this.occluders = [];
    sala.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) this.occluders.push(o);
    });
    this.setLighting(this.lighting);
    this.atualizarMarcadores();
  }

  private criarItem(inst: Instancia, f: Fabrica): THREE.Group | null {
    switch (inst.item) {
      case "sofa": return f.sofa();
      case "poltrona": return f.poltrona();
      case "tv": return f.tv();
      case "wifi": return f.wifi();
      case "pufe": return f.pufe(inst.variante);
      case "jogos": return f.jogos();
      case "esteira": return f.esteira();
      case "bike": return f.bike();
      case "massagem": return f.massagem();
      case "estante": return f.estante();
      case "luminaria": return f.luminaria();
      case "plantas": return f.plantas(inst.variante);
      case "armarios": return f.armarios();
      case "bebedouro": return f.bebedouro();
      case "copa": return f.copa();
      case "biombo": return f.biombo();
      case "ar": return f.ar();
      case "porta": return f.porta();
      case "luz": return f.luz();
      case "sofacama": return f.sofacama();
      case "rede": return f.rede(inst.variante ? Number(inst.variante) : undefined);
      case "recarga": return f.recarga();
      default: return null;
    }
  }

  private criarMarcador(id: ItemId, pos: THREE.Vector3) {
    const it = ITEM_POR_ID[id];
    const el = document.createElement("button");
    el.type = "button";
    el.className = "sala-hs";
    el.textContent = String(it.n);
    el.setAttribute("aria-pressed", "false");
    el.setAttribute("aria-label", `${it.n}. ${it.nome}`);
    el.title = it.nome;
    el.addEventListener("click", () => this.selectItem(id));
    this.o.overlay.appendChild(el);
    this.hotspots.push({ id, el, pos });
  }

  private criarRotuloCota(pos: THREE.Vector3, texto: string) {
    const el = document.createElement("span");
    el.className = "sala-dim";
    el.textContent = texto;
    el.hidden = !this.dimsOn;
    this.o.overlay.appendChild(el);
    this.dimLabels.push({ pos, el });
  }

  /* ---------- câmera ---------- */

  private poseDaVista(v: Vista): { pos: THREE.Vector3; tgt: THREE.Vector3 } | null {
    const { largura: W, profundidade: D } = this.layout;
    const aspecto = this.camera.aspect || 1.6;
    if (v === "geral") {
      const f = clamp(1.3 / aspecto, 1, 1.8);
      return { pos: V(W * 0.78 * f, W * 0.77 * f, W * 0.92 * f).add(V(0, 0, 0.1)), tgt: V(0, 0.45, 0.1) };
    }
    if (v === "planta") {
      const tanMeio = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      return { pos: V(0, Math.max((D / 2 + 1.0) / tanMeio, (W / 2 + 1.0) / (tanMeio * aspecto)), 0.01), tgt: V(0, 0, 0) };
    }
    const lista = this.movs.filter((m) => m.area === v && m.item && m.item !== "plantas");
    if (!lista.length) return null;
    const c = V();
    lista.forEach((m) => c.add(m.obj.position));
    c.multiplyScalar(1 / lista.length);
    const tgt = V(c.x, 0.7, c.z);
    return { pos: this.melhorPose(lista, tgt, 3.1, 1.65, V(-c.x, 0, -c.z)), tgt };
  }

  /**
   * Escolhe de que lado olhar: testa oito direções em volta do alvo e fica com
   * a que deixa mais móveis à vista. O biombo do cochilo, por exemplo, esconde
   * o canto de quem olha do meio da sala, então a vista vem de dentro dele.
   */
  private melhorPose(alvos: Mov[], tgt: THREE.Vector3, dist: number, altura: number, preferida: THREE.Vector3) {
    const { largura: W, profundidade: D } = this.layout;
    if (preferida.lengthSq() > 1e-6) preferida.normalize();
    const centros = alvos.map((m) => new THREE.Box3().setFromObject(m.obj).getCenter(V()));
    let melhor = { pos: V(tgt.x, altura, tgt.z + dist), nota: Infinity };
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const d = V(Math.sin(a), 0, Math.cos(a));
      const pos = V(clamp(tgt.x + d.x * dist, -W / 2 + 0.3, W / 2 - 0.3), altura, clamp(tgt.z + d.z * dist, -D / 2 + 0.3, D / 2 - 0.3));
      let nota = Math.max(0, dist * 0.6 - Math.hypot(pos.x - tgt.x, pos.z - tgt.z)) - d.dot(preferida) * 0.3;
      alvos.forEach((m, i) => {
        this.dir.subVectors(centros[i], pos);
        const longe = this.dir.length();
        this.ray.set(pos, this.dir.normalize());
        this.ray.far = longe;
        const hit = this.primeiroAcerto(this.ray.intersectObjects(this.occluders, false));
        if (!hit || hit.distance > longe - 0.25) return;
        let o: THREE.Object3D | null = hit.object;
        while (o && !o.userData.itemId) o = o.parent;
        if (o !== m.obj) nota += 1;
      });
      if (nota < melhor.nota) melhor = { pos, nota };
    }
    return melhor.pos;
  }

  private poseDoItem(m: Mov): { pos: THREE.Vector3; tgt: THREE.Vector3 } {
    const it = m.item ? ITEM_POR_ID[m.item] : null;
    const p = m.obj.position;
    const tgt = V(p.x, (it?.alturaMarcador ?? 1) * 0.55, p.z);
    let d = V(-p.x, 0, -p.z);
    if (m.parede === "N") d = V(0, 0, 1);
    else if (m.parede === "S") d = V(0, 0, -1);
    else if (m.parede === "W") d = V(1, 0, 0);
    else if (m.parede === "E") d = V(-1, 0, 0);
    if (d.length() < 0.5) d = V(0, 0, 1);
    const dist = m.item === "tv" || m.item === "armarios" || m.item === "estante" || m.item === "plantas" ? 2.8 : 2.2;
    const pos = this.melhorPose([m], tgt, dist, 1.5, d);
    return { pos, tgt };
  }

  private voarPara(pos: THREE.Vector3, tgt: THREE.Vector3, dur: number) {
    if (this.walk.on) this.exitWalk();
    if (dur === 0 || this.mq.matches) {
      this.camera.position.copy(pos);
      this.controls.target.copy(tgt);
      this.controls.update();
      this.requestRender();
      return;
    }
    this.tween = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), start: performance.now(), dur };
    this.requestRender();
  }

  /* ---------- laço de desenho ---------- */

  private requestRender() {
    this.needsRender = true;
  }

  private resize() {
    if (this.disposed) return;
    this.vw = Math.max(1, this.o.viewer.clientWidth);
    this.vh = Math.max(1, this.o.viewer.clientHeight);
    this.renderer.setSize(this.vw, this.vh, false);
    this.camera.aspect = this.vw / this.vh;
    this.camera.updateProjectionMatrix();
    this.requestRender();
  }

  private updateBackground() {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--scene-bg").trim() || "#D9E3E3";
    this.scene.background = new THREE.Color(v);
    this.requestRender();
  }

  private frame(now: number) {
    if (this.disposed) return;
    this.raf = requestAnimationFrame((t) => this.frame(t));
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.inView) return;
    if (this.tween) {
      const tw = this.tween;
      const k = Math.min(1, (performance.now() - tw.start) / tw.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.camera.position.lerpVectors(tw.p0, tw.p1, e);
      this.controls.target.lerpVectors(tw.t0, tw.t1, e);
      if (k >= 1) this.tween = null;
      this.needsRender = true;
    }
    if (this.walk.on) {
      if (this.passoAndar(dt)) this.needsRender = true;
    } else if (this.controls.update()) {
      this.needsRender = true;
    }
    if (this.needsRender) {
      this.needsRender = false;
      this.atualizarParedes();
      this.renderer.render(this.scene, this.camera);
      this.atualizarSobreposicao();
      if (this.firstFrame) {
        this.firstFrame = false;
        this.o.onReady?.();
      }
    }
  }

  private visivel(o: THREE.Object3D | null) {
    while (o) {
      if (!o.visible) return false;
      o = o.parent;
    }
    return true;
  }

  private atualizarParedes() {
    const p = this.camera.position;
    const { largura: W, profundidade: D } = this.layout;
    const fora: Record<Parede, boolean> = { N: p.z < -D / 2, S: p.z > D / 2, W: p.x < -W / 2, E: p.x > W / 2 };
    for (const m of this.movs) m.obj.visible = m.areaOn && !(m.parede && fora[m.parede]);
  }

  private atualizarMarcadores() {
    for (const h of this.hotspots) {
      const algum = this.movs.some((m) => m.item === h.id && m.areaOn);
      h.el.classList.toggle("sem-area", !algum);
    }
  }

  private projetar(pos: THREE.Vector3, el: HTMLElement) {
    this.tmp.copy(pos).project(this.camera);
    const fora = this.tmp.z > 1 || this.tmp.z < -1 || Math.abs(this.tmp.x) > 1.08 || Math.abs(this.tmp.y) > 1.08;
    el.classList.toggle("fora", fora);
    if (!fora) el.style.transform = `translate(${((this.tmp.x + 1) / 2) * this.vw}px, ${((1 - this.tmp.y) / 2) * this.vh}px)`;
    return !fora;
  }

  private primeiroAcerto(hits: THREE.Intersection[]) {
    return hits.find((h) => this.visivel(h.object));
  }

  private atualizarSobreposicao() {
    if (this.hotspotsOn) {
      this.atualizarMarcadores();
      for (const h of this.hotspots) {
        if (!this.projetar(h.pos, h.el)) continue;
        this.dir.subVectors(h.pos, this.camera.position);
        const dist = this.dir.length();
        this.dir.normalize();
        this.ray.set(this.camera.position, this.dir);
        this.ray.far = dist;
        const hit = this.primeiroAcerto(this.ray.intersectObjects(this.occluders, false));
        let atras = false;
        if (hit && hit.distance < dist - 0.2) {
          let o: THREE.Object3D | null = hit.object;
          while (o && !o.userData.itemId) o = o.parent;
          atras = !(o && o.userData.itemId === h.id);
        }
        h.el.classList.toggle("atras", atras);
      }
    }
    if (this.dimsOn) for (const d of this.dimLabels) this.projetar(d.pos, d.el);
  }

  private limparRealce() {
    this.helpers.forEach((h) => {
      this.scene.remove(h);
      h.geometry.dispose();
    });
    this.helpers = [];
  }

  /* ---------- modo caminhar e entrada ---------- */

  private aplicarRotacaoAndar() {
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.set(this.walk.pitch, this.walk.yaw, 0);
  }

  private passoAndar(dt: number) {
    const k = this.walk.keys;
    let f = 0, s = 0;
    if (k.has("f")) f += 1;
    if (k.has("b")) f -= 1;
    if (k.has("l")) s -= 1;
    if (k.has("r")) s += 1;
    if (!f && !s) return false;
    const { largura: W, profundidade: D } = this.layout;
    const sp = 1.5 * dt;
    const fx = -Math.sin(this.walk.yaw), fz = -Math.cos(this.walk.yaw);
    const rx = Math.cos(this.walk.yaw), rz = -Math.sin(this.walk.yaw);
    this.camera.position.x = clamp(this.camera.position.x + (fx * f + rx * s) * sp, -W / 2 + 0.25, W / 2 - 0.25);
    this.camera.position.z = clamp(this.camera.position.z + (fz * f + rz * s) * sp, -D / 2 + 0.25, D / 2 - 0.25);
    return true;
  }

  private escolherEm(cx: number, cy: number) {
    const r = this.o.canvas.getBoundingClientRect();
    this.ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    this.ray.far = Infinity;
    const hit = this.primeiroAcerto(this.ray.intersectObjects(this.occluders, false));
    if (!hit) return;
    let o: THREE.Object3D | null = hit.object;
    while (o && !o.userData.itemId) o = o.parent;
    if (o) this.selectItem(o.userData.itemId as ItemId);
  }

  private bindEvents() {
    const canvas = this.o.canvas;
    const KEYMAP: Record<string, "f" | "b" | "l" | "r"> = {
      KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r",
    };
    const on = <K extends keyof WindowEventMap>(t: K, fn: (e: WindowEventMap[K]) => void) => {
      window.addEventListener(t, fn);
      this.teardown.push(() => window.removeEventListener(t, fn));
    };
    on("keydown", (e) => {
      if (!this.walk.on) return;
      const alvo = e.target as HTMLElement | null;
      if (alvo?.closest?.("input, textarea, select")) return;
      if (e.code === "Escape") { this.exitWalk(); return; }
      const d = KEYMAP[e.code];
      if (d) { this.walk.keys.add(d); e.preventDefault(); }
    });
    on("keyup", (e) => {
      const d = KEYMAP[e.code];
      if (d) this.walk.keys.delete(d);
    });
    on("blur", () => this.walk.keys.clear());

    const aoBaixar = (e: PointerEvent) => {
      this.down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
      if (this.walk.on) canvas.setPointerCapture(e.pointerId);
    };
    const aoMover = (e: PointerEvent) => {
      const d = this.down;
      if (!d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) d.moved = true;
      if (this.walk.on) {
        this.walk.yaw -= (e.clientX - d.lx) * 0.0045;
        this.walk.pitch = clamp(this.walk.pitch - (e.clientY - d.ly) * 0.0045, -1.1, 1.1);
        this.aplicarRotacaoAndar();
        this.requestRender();
      }
      d.lx = e.clientX;
      d.ly = e.clientY;
    };
    const aoSoltar = (e: PointerEvent) => {
      if (this.down && !this.down.moved) this.escolherEm(e.clientX, e.clientY);
      this.down = null;
    };
    const aoCancelar = () => { this.down = null; };
    canvas.addEventListener("pointerdown", aoBaixar);
    canvas.addEventListener("pointermove", aoMover);
    canvas.addEventListener("pointerup", aoSoltar);
    canvas.addEventListener("pointercancel", aoCancelar);
    this.teardown.push(() => {
      canvas.removeEventListener("pointerdown", aoBaixar);
      canvas.removeEventListener("pointermove", aoMover);
      canvas.removeEventListener("pointerup", aoSoltar);
      canvas.removeEventListener("pointercancel", aoCancelar);
    });

    const aoTema = () => this.updateBackground();
    const mqEscuro = window.matchMedia("(prefers-color-scheme: dark)");
    mqEscuro.addEventListener("change", aoTema);
    const mo = new MutationObserver(aoTema);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    this.teardown.push(() => {
      mqEscuro.removeEventListener("change", aoTema);
      mo.disconnect();
    });

    const perdeu = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", perdeu);
    this.teardown.push(() => canvas.removeEventListener("webglcontextlost", perdeu));
  }
}
