import * as THREE from 'three';

// One scene owns its resources. The rest of the site never depends on WebGL.
export async function createPortalScene(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor('#060e11', 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#071114', .037);
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 80);
  camera.position.set(0, 1.3, 15);
  camera.lookAt(0, .7, 0);
  scene.add(new THREE.AmbientLight('#749b99', 2.1));
  const key = new THREE.DirectionalLight('#a5ffe1', 6);
  key.position.set(-2, 6, 6); scene.add(key);
  const rim = new THREE.PointLight('#7d9aff', 75, 18);
  rim.position.set(5, 2, 4); scene.add(rim);
  const gold = new THREE.PointLight('#f5c98b', 50, 18);
  gold.position.set(-1, -1, 3); scene.add(gold);

  const portal = new THREE.Group();
  portal.position.set(2.9, .85, 0); scene.add(portal);
  const metal = new THREE.MeshStandardMaterial({ color: '#7fc5b7', metalness: .82, roughness: .22 });
  const goldMetal = new THREE.MeshStandardMaterial({ color: '#b5a77a', metalness: .78, roughness: .28 });
  const luminous = new THREE.MeshBasicMaterial({ color: '#b6ffe2', transparent: true, opacity: .8 });
  const frame = new THREE.Mesh(new THREE.TorusGeometry(2.5, .115, 20, 180), metal);
  portal.add(frame);
  const innerFrame = new THREE.Mesh(new THREE.TorusGeometry(2.32, .018, 8, 180), luminous);
  innerFrame.position.z = .05; portal.add(innerFrame);
  const outer = new THREE.Mesh(new THREE.TorusGeometry(2.77, .025, 8, 180), goldMetal);
  outer.rotation.set(.2, -.3, .13); portal.add(outer);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(3.24, .018, 10, 180), metal);
  orbit.rotation.set(1.1, -.65, .1); portal.add(orbit);
  const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(3, .012, 8, 180), luminous);
  orbit2.rotation.set(-.7, .8, -.35); portal.add(orbit2);

  const loader = new THREE.TextureLoader();
  const textures: THREE.Texture[] = [];
  const resources: { dispose: () => void }[] = [];
  const urls: string[] = JSON.parse(root.dataset.images || '[]');
  try {
    // Await every loader, including failures, so a partial load can always be disposed.
    const loaded = await Promise.allSettled(urls.map(url => loader.loadAsync(url)));
    loaded.forEach(result => { if (result.status === 'fulfilled') textures.push(result.value); });
    if (loaded.some(result => result.status === 'rejected')) throw new Error('Portal image unavailable');
  } catch (error) { textures.forEach(texture => texture.dispose()); renderer.dispose(); throw error; }
  textures.forEach(texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = texture.image as HTMLImageElement;
    const ratio = image.width / image.height;
    texture.repeat.set(1 / ratio, 1); texture.offset.x = (1 - 1 / ratio) / 2;
    texture.needsUpdate = true;
  });
  const pictureMaterial = new THREE.MeshBasicMaterial({ map: textures[0], color: '#a6d8d3' });
  const picture = new THREE.Mesh(new THREE.CircleGeometry(2.3, 120), pictureMaterial);
  picture.position.z = -.08; portal.add(picture);

  // Soft atmosphere is a small procedural texture, not an external image.
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, '#c2ffe950'); gradient.addColorStop(.36, '#69cdbb18'); gradient.addColorStop(1, '#66eacc00');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas); resources.push(glowTexture);
  const glowMaterial = new THREE.SpriteMaterial({ map: glowTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const halo = new THREE.Sprite(glowMaterial); halo.scale.set(12, 12, 1); halo.position.set(2.9, .9, -1); scene.add(halo);

  // A bed of illuminated fragments makes the portal feel grounded in a world.
  const groundGeo = new THREE.PlaneGeometry(65, 60, 90, 70);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const height = Math.sin(x * .38 + z * .24) * .35 + Math.sin(z * .75 - x * .4) * .17;
    pos.setY(i, height - 3.05);
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: '#071d20', metalness: .65, roughness: .42, flatShading: true }));
  scene.add(ground);
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2 + i * 1.25, .007, 5, 130), new THREE.MeshBasicMaterial({ color: '#5baf9e', transparent: true, opacity: .22 - i * .035 }));
    ring.rotation.x = Math.PI / 2; ring.position.set(2.9, -2.65 + i * .012, .2); scene.add(ring);
  }
  const shardGeo = new THREE.IcosahedronGeometry(1, 0);
  const shardMaterial = new THREE.MeshStandardMaterial({ color: '#34554d', metalness: .5, roughness: .6 });
  const shards = new THREE.InstancedMesh(shardGeo, shardMaterial, 65);
  const dummy = new THREE.Object3D();
  let seed = 41;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 65; i++) {
    const a = random() * Math.PI * 2, r = 3.1 + random() * 5.5;
    dummy.position.set(2.9 + Math.cos(a) * r, -2.6 + random() * .6, Math.sin(a) * r);
    dummy.rotation.set(random() * 3, random() * 3, random() * 3);
    const s = .02 + random() * .09; dummy.scale.set(s, s * (1 + random() * 3), s); dummy.updateMatrix(); shards.setMatrixAt(i, dummy.matrix);
  }
  scene.add(shards);
  const starCount = innerWidth < 700 ? 380 : 850;
  const starPos = new Float32Array(starCount * 3), starColors = new Float32Array(starCount * 3);
  const color = new THREE.Color();
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (random() - .42) * 30;
    starPos[i * 3 + 1] = random() * 15 - 5;
    starPos[i * 3 + 2] = (random() - .6) * 25;
    color.set(random() > .28 ? '#7dd9c2' : '#dbc98b'); color.multiplyScalar(.3 + random() * .7);
    starColors.set([color.r, color.g, color.b], i * 3);
  }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3)); starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMaterial = new THREE.PointsMaterial({ size: .027, vertexColors: true, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending });
  const stars = new THREE.Points(starGeo, starMaterial); scene.add(stars);
  // Fine ticks are embedded around the rim, like an instrument for opening worlds.
  const tickGeo = new THREE.BoxGeometry(.012, .055, .02);
  const ticks = new THREE.InstancedMesh(tickGeo, luminous, 100);
  for (let i = 0; i < 100; i++) {
    const angle = i / 100 * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 2.62, Math.sin(angle) * 2.62, .04);
    dummy.rotation.set(0, 0, angle - Math.PI / 2); dummy.scale.set(1, i % 5 === 0 ? 2 : 1, 1); dummy.updateMatrix(); ticks.setMatrixAt(i, dummy.matrix);
  }
  portal.add(ticks);
  const pointer = { x: 0, y: 0 };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const r = root.getBoundingClientRect();
    pointer.x = (event.clientX - r.left) / r.width - .5;
    pointer.y = (event.clientY - r.top) / r.height - .5;
  };
  const resetPointer = () => { pointer.x = pointer.y = 0; };
  root.addEventListener('pointermove', onPointer); root.addEventListener('pointerleave', resetPointer);
  let running = false, frameId = 0, elapsed = 0, last = 0, disposed = false;
  function render(now: number) {
    if (disposed) return;
    elapsed += Math.min((now - last) / 1000, .04); last = now;
    portal.rotation.y += (pointer.x * .18 - .15 - portal.rotation.y) * .035;
    portal.rotation.x += (pointer.y * .09 - portal.rotation.x) * .035;
    portal.position.y = .85 + Math.sin(elapsed * .5) * .09;
    orbit.rotation.z = elapsed * .065; orbit2.rotation.z = -elapsed * .035;
    outer.rotation.z = .13 + Math.sin(elapsed * .2) * .12;
    stars.rotation.y = elapsed * .006; stars.position.y = Math.sin(elapsed * .13) * .15;
    camera.position.x += (pointer.x * .22 - camera.position.x) * .025;
    renderer.render(scene, camera);
    if (running) frameId = requestAnimationFrame(render);
  }
  const resize = () => {
    const { width, height } = root.getBoundingClientRect();
    renderer.setSize(width, height, false); camera.aspect = width / height;
    const mobile = width < 700;
    camera.fov = mobile ? 49 : 39;
    portal.position.x = mobile ? 1.1 : 2.9;
    portal.scale.setScalar(mobile ? .9 : 1);
    camera.updateProjectionMatrix();
    if (!running) { last = performance.now(); render(last); }
  };
  const observer = new ResizeObserver(resize); observer.observe(root); resize();
  return {
    setRunning(value: boolean) {
      if (disposed || value === running) return;
      running = value;
      if (running) { last = performance.now(); frameId = requestAnimationFrame(render); }
      else cancelAnimationFrame(frameId);
    },
    setWorld(index: number) {
      if (!textures[index] || disposed) return;
      pictureMaterial.map = textures[index]; pictureMaterial.needsUpdate = true;
      const palettes = ['#a5ffe1', '#bab5ff', '#a8e3ff'];
      key.color.set(palettes[index]);
      if (!running) { last = performance.now(); render(last); }
    },
    dispose() {
      disposed = true; running = false; cancelAnimationFrame(frameId); observer.disconnect();
      root.removeEventListener('pointermove', onPointer); root.removeEventListener('pointerleave', resetPointer);
      const unique = new Set<{ dispose: () => void }>([...resources, ...textures]);
      scene.traverse(object => {
        const item = object as THREE.Mesh;
        if (item.geometry) unique.add(item.geometry);
        if (item.material) (Array.isArray(item.material) ? item.material : [item.material]).forEach(mat => unique.add(mat));
      });
      unique.forEach(resource => resource.dispose()); renderer.dispose();
    },
  };
}
