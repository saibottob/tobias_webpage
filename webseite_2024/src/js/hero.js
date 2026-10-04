import * as THREE from "three";

/**
 * Hero: a small smart-energy home (PV roof, battery, heat pump, EV, grid pylon)
 * coordinated by an EMS hub. A simulated day drives the power flows, so the
 * coloured particles always show what actually flows where.
 */

const COLORS = {
  solar: 0xf4c300,
  battery: 0x7ae582,
  grid: 0x5b7cff,
  load: 0xff7a59,
  water: 0x35c6f5,
  policy: 0xb28dff,
};
const fmt = (kw) => `${Math.abs(kw).toFixed(1)} kW`;
const easeOut = (x) => 1 - (1 - x) ** 3;
const bump = (h, m, w) => Math.exp(-(((h - m) / w) ** 2));
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function initHero(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    document.documentElement.classList.add("no-webgl");
    return;
  }
  const isMobile = window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 2.2, 19);
  camera.lookAt(0, -0.2, 0);

  const root = new THREE.Group();
  root.rotation.y = -0.5;
  scene.add(root);

  /* ---------- Theme-aware materials ---------- */
  const themed = [];
  const T = (mat, dark, light) => (themed.push({ mat, dark, light }), mat);
  const fillMat = (d, l) =>
    T(new THREE.MeshBasicMaterial({ color: d, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), d, l);
  const lineMat = (d, l, opacity = 1) =>
    T(new THREE.LineBasicMaterial({ color: d, transparent: opacity < 1, opacity }), d, l);
  const applyTheme = () => {
    const light = document.documentElement.dataset.theme === "light";
    themed.forEach((t) => t.mat.color.setHex(light ? t.light : t.dark));
  };

  const solid = (geo, fill, fillL, edge, edgeL) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, fillMat(fill, fillL)));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(edge, edgeL)));
    return g;
  };
  const place = (obj, x, y, z) => (obj.position.set(x, y, z), root.add(obj), obj);

  /* ---------- Sprite texture for glow + particles ---------- */
  const glowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.35, "rgba(255,255,255,0.55)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  /* ---------- Ground ---------- */
  const grid = new THREE.GridHelper(18, 18, 0x000000, 0x000000);
  grid.position.y = -2;
  grid.material = lineMat(0x27407f, 0x9fb3e0, 0.35);
  root.add(grid);

  /* ---------- House (ridge along x, PV on the front slope) ---------- */
  const houseBody = solid(new THREE.BoxGeometry(3.4, 2, 2.4), 0x0f2160, 0xffffff, 0x5b8cff, 0x003da5);
  houseBody.children[0].material.transparent = true; // see the EMS inside
  houseBody.children[0].material.opacity = 0.32;
  houseBody.children[0].material.depthWrite = false;
  place(houseBody, 0, -1, 0);

  const roofShape = new THREE.Shape([new THREE.Vector2(-1.3, 0), new THREE.Vector2(1.3, 0), new THREE.Vector2(0, 1.3)]);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 3.6, bevelEnabled: false });
  roofGeo.translate(0, 0, -1.8);
  roofGeo.rotateY(Math.PI / 2); // extrusion now runs along x
  place(solid(roofGeo, 0x162b73, 0xe3ebfb, 0x5b8cff, 0x003da5), 0, 0, 0);

  // PV panel on the front roof slope (faces camera and sun)
  const slope = Math.PI / 4;
  const panel = new THREE.Group();
  panel.add(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.5), fillMat(0x0a3a9e, 0x1a4fc4)));
  const cells = [];
  for (let i = -4; i <= 4; i++) cells.push(V(i * 0.325, -0.75, 0.01), V(i * 0.325, 0.75, 0.01));
  for (let j = -2; j <= 2; j++) cells.push(V(-1.3, j * 0.375, 0.01), V(1.3, j * 0.375, 0.01));
  const panelLinesMat = lineMat(0x9ec0ff, 0xbcd2ff, 0.9);
  panel.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cells), panelLinesMat));
  panel.rotation.x = -slope;
  panel.position.set(0, 0.65 + Math.cos(slope) * 0.04, 0.65 + Math.sin(slope) * 0.04);
  root.add(panel);

  // windows on the front face
  const winMat = new THREE.MeshBasicMaterial({ color: 0xf4c300, transparent: true, opacity: 0.4 });
  [-1.0, 1.0].forEach((x) => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), winMat);
    w.position.set(x, -0.7, 1.21);
    root.add(w);
  });

  /* ---------- Battery (front left) ---------- */
  place(solid(new THREE.BoxGeometry(1.0, 1.5, 0.8), 0x10301c, 0xe9f8ec, 0x7ae582, 0x2f9e44), -3.9, -1.25, 1.4);
  place(solid(new THREE.BoxGeometry(0.4, 0.12, 0.3), 0x10301c, 0xe9f8ec, 0x7ae582, 0x2f9e44), -3.9, -0.44, 1.4);
  const batBars = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshBasicMaterial({ color: COLORS.battery, transparent: true }));
    m.position.set(-3.9, -1.85 + i * 0.25, 1.81);
    root.add(m);
    batBars.push(m);
  }

  /* ---------- Heat pump (back left) ---------- */
  place(solid(new THREE.BoxGeometry(1.5, 1.2, 0.7), 0x2b1a40, 0xfbeee9, 0xff7a59, 0xd9502b), -2.6, -1.4, 0.0);
  const fan = new THREE.Group();
  fan.position.set(-2.6, -1.4, 0.37);
  fan.add(new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 32), lineMat(0xff7a59, 0xd9502b)));
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshBasicMaterial({ color: 0xff7a59 }));
    b.position.set(Math.cos((i * Math.PI) / 2) * 0.18, Math.sin((i * Math.PI) / 2) * 0.18, 0);
    b.rotation.z = (i * Math.PI) / 2;
    fan.add(b);
  }
  root.add(fan);

  /* ---------- Wallbox + EV (front right) ---------- */
  place(solid(new THREE.BoxGeometry(0.25, 1.0, 0.25), 0x2b1a40, 0xfbeee9, 0xff7a59, 0xd9502b), 3.0, -1.5, 2.2);
  const wbLamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: COLORS.load }));
  wbLamp.position.set(3.0, -0.92, 2.34);
  root.add(wbLamp);
  // the car drives in, charges, and drives off again (driven by the simulated clock)
  const PARK_X = 4.5;
  const carG = new THREE.Group();
  carG.position.set(10, 0, 2.2);
  root.add(carG);
  const carBody = solid(new THREE.BoxGeometry(2.0, 0.45, 0.9), 0x1b2a55, 0xdfe7fa, 0x7fa2ff, 0x003da5);
  carBody.position.set(0, -1.55, 0);
  const carCabin = solid(new THREE.BoxGeometry(1.0, 0.4, 0.8), 0x1b2a55, 0xdfe7fa, 0x7fa2ff, 0x003da5);
  carCabin.position.set(-0.1, -1.13, 0);
  carG.add(carBody, carCabin);
  const wheels = [];
  [[-0.65, 0.4], [0.65, 0.4], [-0.65, -0.4], [0.65, -0.4]].forEach(([x, z]) => {
    const wg = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16);
    wg.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wg, fillMat(0x05091a, 0x0a1538));
    wheel.position.set(x, -1.78, z);
    carG.add(wheel);
    wheels.push(wheel);
  });
  // charging cable from wallbox to car
  const cableMat = new THREE.LineBasicMaterial({ color: COLORS.load });
  const cable = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(V(3.0, -1.0, 2.3), V(3.25, -1.75, 2.35), V(PARK_X - 1.0, -1.45, 2.2)).getPoints(12)),
    cableMat
  );
  cable.visible = false;
  root.add(cable);

  /* ---------- Grid pylon ---------- */
  const pylon = (() => {
    const pts = [];
    const seg = (a, b) => pts.push(a, b);
    const bw = 0.75, tw = 0.14, h0 = -2, h1 = 2.1;
    const corner = (sx, sz, y) => {
      const k = (y - h0) / (h1 - h0);
      const w = bw + (tw - bw) * k;
      return V(sx * w, y, sz * w);
    };
    const levels = [h0, -0.6, 0.6, 1.6, h1];
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => seg(corner(sx, sz, h0), corner(sx, sz, h1)));
    for (let i = 0; i < levels.length - 1; i++) {
      const y0 = levels[i], y1 = levels[i + 1];
      [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]].forEach(([ax, az, bx, bz]) => {
        seg(corner(ax, az, y0), corner(bx, bz, y0));
        seg(corner(ax, az, y0), corner(bx, bz, y1));
        seg(corner(ax, az, y1), corner(bx, bz, y0));
      });
    }
    // cross arms
    [0.6, 1.6].forEach((y, i) => {
      const len = 1.5 - i * 0.4;
      seg(V(-len, y, 0), V(len, y, 0));
      seg(V(-len, y, 0), V(-len * 0.6, y + 0.25, 0));
      seg(V(len, y, 0), V(len * 0.6, y + 0.25, 0));
    });
    // wires running off into the distance
    [[-1.5, 0.6], [1.5, 0.6], [-1.1, 1.6], [1.1, 1.6]].forEach(([x, y]) => seg(V(x, y, 0), V(x * 1.0 + 3.5, y - 0.2, -7)));
    const g = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat(0x7fa2ff, 0x003da5));
    g.position.set(5.9, 0, -3.4);
    root.add(g);
    return g;
  })();

  /* ---------- Sun ---------- */
  const sunGroup = new THREE.Group();
  sunGroup.position.set(1.2, 4.3, -2.2); // behind the cloud, so rain clouds cover it
  root.add(sunGroup);
  const sunBody = solid(new THREE.IcosahedronGeometry(0.62, 1), 0xf4c300, 0xf4c300, 0xffe27a, 0xc99700);
  const sunMat = sunBody.children[0].material;
  sunGroup.add(sunBody);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: COLORS.solar, transparent: true, depthWrite: false }));
  halo.scale.setScalar(4.2);
  sunGroup.add(halo);
  const rayPts = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    rayPts.push(V(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0), V(Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0));
  }
  const rays = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rayPts), new THREE.LineBasicMaterial({ color: COLORS.solar, transparent: true }));
  

  /* ---------- EMS hub ---------- */
  const hubPos = V(0, -1.0, 0.2);
  const hub = new THREE.Group();
  hub.position.copy(hubPos);
  root.add(hub);
  hub.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: COLORS.solar })));
  const hubShell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.34, 0)), lineMat(0xf4c300, 0xc99700));
  hub.add(hubShell);
  const hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.01, 6, 48), lineMat(0xf4c300, 0xc99700));
  hubRing.rotation.x = Math.PI / 2;
  hub.add(hubRing);
  const hubGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: COLORS.solar, transparent: true, opacity: 0.22, depthWrite: false }));
  hubGlow.scale.setScalar(1.2);
  hub.add(hubGlow);


  /* ---------- Gemeindehaus (Politik / Rahmenbedingungen) ---------- */
  place(solid(new THREE.BoxGeometry(2.4, 1.3, 1.3), 0x1d1650, 0xf3eeff, 0xb28dff, 0x6d3fd6), -5.1, -1.35, -3.4);
  const gShape = new THREE.Shape([new THREE.Vector2(-1.35, 0), new THREE.Vector2(1.35, 0), new THREE.Vector2(0, 0.6)]);
  const gGeo = new THREE.ExtrudeGeometry(gShape, { depth: 1.4, bevelEnabled: false });
  gGeo.translate(0, 0, -0.7);
  place(solid(gGeo, 0x261c66, 0xe6dcff, 0xb28dff, 0x6d3fd6), -5.1, -0.7, -3.4);
  for (let i = 0; i < 4; i++) {
    const colm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), fillMat(0xb28dff, 0x6d3fd6));
    colm.position.set(-5.9 + i * 0.53, -1.35, -2.7);
    root.add(colm);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), fillMat(0xb28dff, 0x6d3fd6));
  pole.position.set(-5.1, 0.0, -3.4);
  root.add(pole);
  const flag = new THREE.Group();
  flag.add(new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ color: 0xe30613, side: THREE.DoubleSide })));
  [[0.36, 0.1], [0.1, 0.36]].forEach(([w, h]) => {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    c.position.z = 0.005;
    flag.add(c);
  });
  flag.position.set(-4.82, 0.45, -3.4);
  root.add(flag);

  /* ---------- Regenwasser: cloud, tank, garden bed ---------- */
  const cloud = new THREE.Group();
  [[0, 0, 0.55], [0.6, -0.1, 0.42], [-0.6, -0.12, 0.4], [0.2, 0.3, 0.4]].forEach(([x, y, r]) => {
    const c = solid(new THREE.IcosahedronGeometry(r, 1), 0x24356f, 0xffffff, 0x8fb0ff, 0x7b93c9);
    c.position.set(x, y, 0);
    cloud.add(c);
  });
  cloud.position.set(2.4, 4.1, 0.0);
  root.add(cloud);

  const tankPos = V(2.8, -1.3, 0.3);
  place(solid(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 20), 0x0c2c44, 0xe3f5fd, 0x35c6f5, 0x0b89b3), tankPos.x, tankPos.y, tankPos.z);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.2, 20), new THREE.MeshBasicMaterial({ color: COLORS.water, transparent: true, opacity: 0.75 }));
  water.position.set(tankPos.x, -1.9, tankPos.z);
  root.add(water);
  place(solid(new THREE.BoxGeometry(1.4, 0.16, 0.8), 0x2a2114, 0xf1e7d6, 0x9b7b45, 0x8a6a30), 3.6, -1.92, -1.5);
  [-0.45, 0, 0.45].forEach((x, i) => {
    const plant = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42 + i * 0.06, 6), new THREE.MeshBasicMaterial({ color: 0x5ed46a }));
    plant.position.set(3.6 + x, -1.65 + i * 0.03, -1.5);
    root.add(plant);
  });
  // rain drops
  const M = isMobile ? 12 : 24;
  const rainPos = new Float32Array(M * 3).fill(-999);
  const drops = Array.from({ length: M }, () => ({ x: 0.6 + Math.random() * 3.2, z: -1.0 + Math.random() * 2.6, y: Math.random() * 5.5 - 1.8, v: 2.4 + Math.random() * 1.4 }));
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: COLORS.water, size: 0.12, map: glowTex, transparent: true, depthWrite: false }));
  rain.frustumCulled = false;
  root.add(rain);

  /* ---------- Flow paths ---------- */
  const anchors = {
    sun: V(1.0, 3.7, -2.0),
    roof: V(0, 0.7, 0.75),
    battery: V(-3.9, -0.3, 1.4),
    pump: V(-2.6, -0.7, 0.0),
    car: V(3.0, -0.8, 2.3), // wallbox
    pylon: V(5.2, 1.65, -3.4),
    townhall: V(-5.1, 0.6, -3.4),
    ridge: V(0, 1.3, 0),
    eave: V(1.7, 0.05, 1.3),
    tankTop: V(2.8, -0.55, 0.3),
    bed: V(3.6, -1.5, -1.5),
  };
  const curve = (a, b, lift) => new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(V(0, lift, 0)), b);
  const N = isMobile ? 4 : 6; // few, slow "packets" keep the scene calm
  const flowDefs = [
    { id: "sun", c: curve(anchors.sun, anchors.roof, 0.2), color: COLORS.solar },
    { id: "pv", c: curve(anchors.roof, hubPos, 0.6), color: COLORS.solar },
    { id: "charge", c: curve(hubPos, anchors.battery, 0.5), color: COLORS.solar },
    { id: "discharge", c: curve(anchors.battery, hubPos, -0.25), color: COLORS.battery },
    { id: "export", c: curve(hubPos, anchors.pylon, 3.2), color: COLORS.grid },
    { id: "import", c: curve(anchors.pylon, hubPos, 1.6), color: COLORS.grid },
    { id: "pump", c: curve(hubPos, anchors.pump, 0.4), color: COLORS.load },
    { id: "car", c: curve(hubPos, anchors.car, 0.9), color: COLORS.load },
    { id: "polHouse", c: curve(anchors.townhall, anchors.ridge, 1.8), color: COLORS.policy },
    { id: "polGrid", c: curve(anchors.townhall, anchors.pylon, 3.6), color: COLORS.policy },
    { id: "gutter", c: curve(anchors.eave, anchors.tankTop, -0.2), color: COLORS.water },
    { id: "irrigate", c: curve(anchors.tankTop, anchors.bed, 0.5), color: COLORS.water },
  ];
  const total = flowDefs.length * N;
  const pPos = new Float32Array(total * 3).fill(-999);
  const pCol = new Float32Array(total * 3);
  const col = new THREE.Color();
  flowDefs.forEach((f, fi) => {
    f.t = Array.from({ length: N }, (_, i) => i / N);
    f.offset = fi * N;
    f.level = 0;
    col.setHex(f.color);
    for (let i = 0; i < N; i++) col.toArray(pCol, (f.offset + i) * 3);
    // faint guide line
    f.line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(f.c.getPoints(32)),
      new THREE.LineBasicMaterial({ color: f.color, transparent: true, opacity: 0.1, depthWrite: false })
    );
    root.add(f.line);
  });
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ size: 0.36, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true })
  );
  particles.frustumCulled = false;
  root.add(particles);
  const flowById = Object.fromEntries(flowDefs.map((f) => [f.id, f]));

  /* ---------- Labels ---------- */
  const labelRoot = document.getElementById("hero-labels");
  const labelDefs = [ { id: "sun", name: "Sonne", dot: "#f4c300", at: V(1.2, 5.3, -2.2), m: 1 },
    { id: "town", name: "Gemeinde", dot: "#b28dff", at: V(-5.1, 1.85, -3.4), m: 1 },
    { id: "water", name: "Regenwasser", dot: "#35c6f5", at: V(2.8, -0.35, 0.3), m: 0 },
    { id: "pv", name: "PV-Anlage", dot: "#f4c300", at: V(0, 1.9, 0.9), m: 1 },
    { id: "ems", name: "EMS", dot: "#f4c300", at: V(0, -0.35, 0.2), m: 0 },
    { id: "bat", name: "Speicher", dot: "#7ae582", at: V(-3.9, 0.15, 1.4), m: 1 },
    { id: "pump", name: "Wärmepumpe", dot: "#ff7a59", at: V(-2.6, -0.45, 0.0), m: 0 },
    { id: "car", name: "E-Auto", dot: "#ff7a59", at: V(4.5, -0.6, 2.2), m: 0 },
    { id: "grid", name: "Netz", dot: "#4d84ff", at: V(5.9, 2.55, -3.4), m: 1 },
  ];
  labelDefs.forEach((l) => {
    const el = document.createElement("div");
    el.className = "h-label";
    el.dataset.m = l.m;
    el.style.setProperty("--dot", l.dot);
    el.innerHTML = `<i></i><b>${l.name}</b>`;
    labelRoot?.appendChild(el);
    l.el = el;
  });
  const labelById = Object.fromEntries(labelDefs.map((l) => [l.id, l]));
  const hud = Object.fromEntries(["time", "pv", "load", "soc", "grid", "water", "town"].map((k) => [k, document.getElementById(`hud-${k}`)]));

  /* ---------- Simulation ---------- */
  const sim = { sunF: 0.8, carX: 10, parked: false, h: 12.8, soc: 45, tank: 40, rain: 0, irr: 0, pv: 0, load: 0, hp: 0, car: 0, charge: 0, dis: 0, exp: 0, imp: 0, direct: 0, base: 0 };
  const smooth = { ...sim };
  function stepSim(dt, t) {
    const dh = dt * 0.25; // 1 simulated hour = 4 s, a full day = 96 s
    sim.h = (sim.h + dh) % 24;
    const sunF = Math.max(0, Math.sin((Math.PI * (sim.h - 6)) / 13));
    const cloud = 0.88 + 0.12 * Math.sin(t * 0.9);
    const rainL = Math.min(1, bump(sim.h, 15, 1.0) * 1.3 + 0.8 * bump(sim.h, 3.5, 0.9));
    const pv = 7.2 * Math.pow(sunF, 1.2) * cloud * (1 - 0.75 * rainL);
    const irr = bump(sim.h, 7, 0.8) + bump(sim.h, 19.5, 0.8) > 0.3 && sim.tank > 4 ? 1 : 0;
    sim.tank = Math.min(100, Math.max(0, sim.tank + rainL * dh * 30 - irr * dh * 22));
    const base = 0.35 + 0.9 * bump(sim.h, 7.5, 1.2) + 1.1 * bump(sim.h, 19, 1.8);
    const hp = 0.6 + 0.7 * bump(sim.h, 6, 2.5) + 0.7 * bump(sim.h, 20.5, 2.5);
    const h = sim.h;
    const carX = h < 9 ? 10 : h < 9.9 ? 10 - 5.5 * easeOut((h - 9) / 0.9) : h < 15.5 ? PARK_X : h < 16.4 ? PARK_X + 5.5 * easeOut((h - 15.5) / 0.9) : 10;
    const parked = Math.abs(carX - PARK_X) < 0.05;
    const car = parked && pv > 3 ? 3.7 : 0;
    sim.carX = carX;
    sim.parked = parked;
    const load = base + hp + car;
    const direct = Math.min(pv, load);
    const surplus = pv - direct;
    const deficit = load - direct;
    const charge = surplus > 0 && sim.soc < 98 ? Math.min(surplus, 3) : 0;
    const dis = deficit > 0 && sim.soc > 12 ? Math.min(deficit, 3) : 0;
    sim.soc = Math.min(100, Math.max(0, sim.soc + ((charge - dis) * dh * 100) / 30));
    Object.assign(sim, { rain: rainL, irr, sunF, pv, base, hp, car, load, direct, charge, dis, exp: surplus - charge, imp: deficit - dis });
    const k = Math.min(1, dt * 3);
    for (const key of ["rain", "irr", "pv", "load", "hp", "car", "charge", "dis", "exp", "imp", "direct", "base", "sunF"]) {
      smooth[key] += (sim[key] - smooth[key]) * k;
    }
    smooth.soc = sim.soc;
    smooth.tank = sim.tank;
    smooth.h = sim.h;
  }

  const topics = ["Rahmenbedingungen", "Bewilligungen", "Raumplanung", "Energiepolitik", "Mitsprache", "Versammlung"];
  const phase = (h) => (h < 5 ? "Nacht" : h < 10 ? "Morgen" : h < 14 ? "Mittag" : h < 18 ? "Nachmittag" : h < 22 ? "Abend" : "Nacht");
  const levelOf = (kw, max = 4) => (kw < 0.05 ? 0 : Math.min(1, 0.25 + kw / max));

  /* ---------- Layout ---------- */
  const proj = new THREE.Vector3();
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const dist = camera.position.z;
    const vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const vw = vh * camera.aspect;
    const sceneW = 13.5;
    if (w > 900) {
      const avail = vw * 0.58;
      const s = Math.min(1.5, avail / sceneW);
      root.scale.setScalar(s);
      root.position.set(vw * 0.18, 0.5, 0);
    } else {
      const s = (vw * 0.92) / sceneW;
      root.scale.setScalar(s);
      root.position.set(-0.5 * s, -0.2, 0);
    }
  }
  resize();
  window.addEventListener("resize", resize);

  const target = { x: 0, y: 0 };
  window.addEventListener(
    "pointermove",
    (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  applyTheme();
  window.addEventListener("themechange", applyTheme);

  /* ---------- Loop ---------- */
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let hudTimer = 0;
  let paused = false;
  const pauseBtn = document.getElementById("hud-pause");
  pauseBtn?.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.textContent = paused ? "▶" : "❚❚";
    pauseBtn.setAttribute("aria-label", paused ? "Animation fortsetzen" : "Animation pausieren");
  });

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (paused) return;
    const t = clock.elapsedTime;
    stepSim(dt, t);
    const s = smooth;

    // camera drift with pointer
    root.rotation.y += (-0.5 + target.x * 0.3 + Math.sin(t * 0.25) * 0.06 - root.rotation.y) * 0.04;
    root.rotation.x += (target.y * 0.1 - root.rotation.x) * 0.04;

    // flow levels
    const L = {
      sun: levelOf(s.pv, 7),
      pv: levelOf(s.pv, 7),
      charge: levelOf(s.charge),
      discharge: levelOf(s.dis),
      export: levelOf(s.exp),
      import: levelOf(s.imp),
      house: levelOf(s.base),
      pump: levelOf(s.hp),
      car: levelOf(s.car),
      polHouse: 0.25 + 0.2 * Math.sin(t * 1.3),
      polGrid: 0.2 + 0.2 * Math.sin(t * 1.3 + 2),
      gutter: s.rain > 0.08 && s.tank < 99 ? 0.3 + 0.7 * s.rain : 0,
      irrigate: s.irr > 0.3 ? 0.45 : 0,
    };
    flowDefs.forEach((f) => {
      f.level += (L[f.id] - f.level) * Math.min(1, dt * 4);
      const count = f.level < 0.02 ? 0 : Math.max(2, Math.round(f.level * N));
      f.line.material.opacity = (f.id.startsWith("pol") ? 0.07 : 0.2) + f.level * 0.28;
      for (let i = 0; i < N; i++) {
        const idx = (f.offset + i) * 3;
        if (i < count) {
          f.t[i] = (f.t[i] + dt * (0.09 + f.level * 0.12)) % 1;
          f.c.getPoint(f.t[i], tmp);
          pPos[idx] = tmp.x;
          pPos[idx + 1] = tmp.y;
          pPos[idx + 2] = tmp.z;
        } else {
          pPos[idx + 1] = -999;
        }
      }
    });
    pGeo.attributes.position.needsUpdate = true;

    // sun, hub, objects
    const light = document.documentElement.dataset.theme === "light";
    sunMat.color.setHex(light ? 0x9fb0dd : 0xaab8e8).lerp(col.setHex(COLORS.solar), Math.min(1, s.sunF * 1.6));
    halo.material.opacity = 0.1 + 0.35 * s.sunF;
    halo.scale.setScalar(2 + 1.2 * s.sunF);
    rays.material.opacity = 0.15 + 0.85 * s.sunF;
    rays.material.color.copy(sunMat.color);
    rays.rotation.z = t * 0.15;
    sunGroup.scale.setScalar(0.85 + 0.2 * s.sunF);

    // car motion
    carG.position.x = sim.carX;
    carG.visible = sim.carX < 9.6;
    const moving = !sim.parked && carG.visible;
    wheels.forEach((w) => (w.rotation.z -= moving ? dt * 9 : 0));
    cable.visible = sim.parked;
    cableMat.color.setHex(s.car > 0.1 ? COLORS.load : 0x55608a);
    labelById.car.at.x = sim.carX;

    // cloud + rain + tank + flag
    cloud.scale.setScalar(Math.max(0.001, Math.min(1, s.rain * 1.6)));
    cloud.position.x = 2.4 + Math.sin(t * 0.3) * 0.15;
    const nDrops = Math.round(s.rain * M);
    drops.forEach((d, i) => {
      if (i < nDrops) {
        d.y -= d.v * dt;
        if (d.y < -2) d.y = 3.8;
        rainPos[i * 3] = d.x;
        rainPos[i * 3 + 1] = d.y;
        rainPos[i * 3 + 2] = d.z;
      } else rainPos[i * 3 + 1] = -999;
    });
    rainGeo.attributes.position.needsUpdate = true;
    const lvl = Math.max(0.02, s.tank / 100);
    water.scale.y = lvl;
    water.position.y = -2 + 0.6 * lvl;
    flag.rotation.y = Math.sin(t * 2) * 0.35;

    hubShell.rotation.y += dt * 0.8;
    hubShell.rotation.x += dt * 0.5;
    hubRing.rotation.z += dt * 0.6;
    hub.scale.setScalar(1 + Math.sin(t * 2.4) * 0.05);

    panelLinesMat.opacity = 0.35 + 0.6 * s.sunF;
    const night = 1 - Math.min(1, s.sunF * 2.2);
    winMat.opacity = 0.25 + 0.7 * night;

    batBars.forEach((b, i) => {
      const on = s.soc > i * 20 + 6;
      b.material.opacity = on ? 0.95 : 0.12;
    });
    fan.rotation.z -= dt * (1 + s.hp * 5);
    wbLamp.material.color.setHex(s.car > 0.1 ? COLORS.battery : sim.parked ? COLORS.solar : 0x55608a);

    // labels (project 3D anchors to screen)
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    labelById.car.el.style.opacity = carG.visible ? 1 : 0;
    labelDefs.forEach((l) => {
      proj.copy(l.at);
      root.localToWorld(proj);
      proj.project(camera);
      const x = (proj.x * 0.5 + 0.5) * w;
      const y = (-proj.y * 0.5 + 0.5) * h;
      l.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    });

    hudTimer -= dt;
    if (hudTimer <= 0) {
      hudTimer = 0.2;
      const hh = Math.floor(s.h);
      const mm = Math.floor((s.h % 1) * 60);
      const net = s.exp > s.imp ? -s.exp : s.imp;
      if (hud.time) {
        hud.time.textContent = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} · ${phase(s.h)}`;
        hud.pv.textContent = fmt(s.pv);
        hud.load.textContent = fmt(s.load);
        hud.soc.textContent = `${Math.round(s.soc)} %${s.charge > 0.1 ? " ↑" : s.dis > 0.1 ? " ↓" : ""}`;
        hud.grid.textContent = `${net < -0.05 ? "↑ " + fmt(net) : net > 0.05 ? "↓ " + fmt(net) : "ausgeglichen"}`;
      }
      const topic = topics[Math.floor(t / 6) % topics.length];
      if (hud.water) {
        hud.water.textContent = `${Math.round(s.tank)} %${s.rain > 0.1 ? " ↑ Regen" : s.irr > 0.3 ? " ↓ Garten" : ""}`;
        hud.town.textContent = topic;
      }
    }

    renderer.render(scene, camera);
  }
  frame();
}
