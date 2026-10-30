/* ==========================================================================
   OVERDOZED — 3D t-shirt (Three.js)
   A procedural tee: an extruded, heavily bevelled silhouette so it reads as
   puffy fabric, plus printed chest/back panels drawn on canvas.
   Auto-rotates, follows the pointer, can be dragged, recolours on demand.
   ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

function teeShape() {
  // Units roughly match a flat-lay oversized tee, centred at the origin.
  const s = new THREE.Shape();
  s.moveTo(-0.55, 1.35);                                   // left collar
  s.quadraticCurveTo(0, 0.95, 0.55, 1.35);                 // neckline dip
  s.lineTo(1.25, 1.12);                                    // right shoulder
  s.lineTo(1.95, 0.35);                                    // right sleeve end (top)
  s.lineTo(1.45, -0.05);                                   // right sleeve end (bottom)
  s.lineTo(1.08, 0.32);                                    // right armpit
  s.lineTo(1.1, -1.55);                                    // right hem
  s.quadraticCurveTo(0, -1.62, -1.1, -1.55);               // hem curve
  s.lineTo(-1.08, 0.32);                                   // left armpit
  s.lineTo(-1.45, -0.05);
  s.lineTo(-1.95, 0.35);
  s.lineTo(-1.25, 1.12);
  s.lineTo(-0.55, 1.35);
  return s;
}

function printTexture(front) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 1024);
  g.textAlign = 'center';
  if (front) {
    // Small chest wordmark
    g.fillStyle = '#FF3D2E';
    g.font = '160px Anton, Impact, sans-serif';
    g.fillText('OVERDOZED', 512, 380);
    g.fillStyle = '#E8B931';
    g.font = '600 46px "JetBrains Mono", monospace';
    g.fillText('WEAR THE LEGEND · EST. ON INSTAGRAM', 512, 460);
  } else {
    // Big back print: a trident-in-sun emblem
    g.translate(512, 470);
    g.strokeStyle = '#FF3D2E'; g.lineWidth = 14;
    g.beginPath(); g.arc(0, 0, 260, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 24; i++) {
      g.rotate(Math.PI / 12);
      g.beginPath(); g.moveTo(0, -285); g.lineTo(0, -335); g.stroke();
    }
    g.fillStyle = '#E8B931';
    g.beginPath();
    g.moveTo(-14, 210); g.lineTo(-14, -60); g.lineTo(-90, -120); g.lineTo(-110, -230); g.lineTo(-70, -150);
    g.lineTo(-14, -110); g.lineTo(-14, -240); g.lineTo(0, -300); g.lineTo(14, -240); g.lineTo(14, -110);
    g.lineTo(70, -150); g.lineTo(110, -230); g.lineTo(90, -120); g.lineTo(14, -60); g.lineTo(14, 210); g.closePath();
    g.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#EFE8DC';
    g.font = '150px Anton, Impact, sans-serif';
    g.fillText('OVERDOZED', 512, 940);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function initTee(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 8.2);

  // Lights: warm key, red rim, soft fill
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x1a1210, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff3d2e, 2.4); rim.position.set(-4, 1, -3); scene.add(rim);
  const fill = new THREE.PointLight(0xe8b931, 6, 12); fill.position.set(0, -3, 3); scene.add(fill);

  // Fabric body
  const depth = 0.22, bevel = 0.18;
  const geo = new THREE.ExtrudeGeometry(teeShape(), {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: 0.12, bevelSegments: 10, curveSegments: 24,
  });
  geo.translate(0, 0.1, -depth / 2);
  geo.computeVertexNormals();
  const fabric = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#111111'), roughness: 0.92, metalness: 0,
    sheen: 1, sheenRoughness: 0.8, sheenColor: new THREE.Color('#555'),
  });
  const tee = new THREE.Group();
  tee.add(new THREE.Mesh(geo, fabric));

  // Printed panels sit just above each face
  const z = depth / 2 + bevel + 0.002;
  const panel = (tex, size, y, back) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1 }));
    m.position.set(0, y, back ? -z : z);
    if (back) m.rotation.y = Math.PI;
    return m;
  };
  tee.add(panel(printTexture(true), 1.5, 0.45, false));
  tee.add(panel(printTexture(false), 1.95, -0.15, true));
  scene.add(tee);

  // Soft contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.1; shadow.scale.set(1.3, 0.5, 1);
  scene.add(shadow);

  // Size to container
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Interaction: pointer tilt + drag to spin
  let targetX = 0, targetY = 0, spin = 0, velocity = 0, dragging = false, lastX = 0;
  addEventListener('pointermove', (e) => {
    targetY = (e.clientX / innerWidth - 0.5) * 0.6;
    targetX = (e.clientY / innerHeight - 0.5) * 0.35;
  }, { passive: true });
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    velocity = (e.clientX - lastX) * 0.01; spin += velocity; lastX = e.clientX;
  });
  const stop = () => (dragging = false);
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);

  // Colour tween
  const targetColor = fabric.color.clone();
  const setColor = (hex) => {
    targetColor.set(hex);
    const light = targetColor.getHSL({}).l > 0.6;
    fabric.sheenColor.set(light ? '#ffffff' : '#555555');
  };

  // Pause when off-screen
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!dragging) { velocity *= 0.94; spin += velocity + (reducedMotion ? 0 : dt * 0.35); }
    tee.rotation.y += (spin + targetY - tee.rotation.y) * 0.08;
    tee.rotation.x += (targetX - tee.rotation.x) * 0.08;
    tee.position.y = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 1.2) * 0.06;
    fabric.color.lerp(targetColor, 0.08);
    renderer.render(scene, camera);
  });

  return { setColor };
}
