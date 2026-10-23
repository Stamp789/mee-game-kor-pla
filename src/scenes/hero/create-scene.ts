import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export async function createWorldScene(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dfe3f2');
  scene.fog = new THREE.Fog('#dfe3f2', 18, 35);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60);
  camera.position.set(0, .3, 11.8);
  camera.lookAt(0, 0, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.AmbientLight('#edf1ff', 1.6));
  const key = new THREE.DirectionalLight('#ffffff', 4);
  key.position.set(-4, 7, 6); scene.add(key);
  const fill = new THREE.DirectionalLight('#8eabff', 2.2);
  fill.position.set(5, -2, 3); scene.add(fill);
  const group = new THREE.Group(); scene.add(group);
  const blue = new THREE.MeshPhysicalMaterial({ color: '#263cfa', metalness: .38, roughness: .18, clearcoat: 1, clearcoatRoughness: .12 });
  const white = new THREE.MeshPhysicalMaterial({ color: '#f8f9ff', metalness: .18, roughness: .22, clearcoat: 1 });
  const dark = new THREE.MeshPhysicalMaterial({ color: '#141b32', metalness: .45, roughness: .23, clearcoat: 1 });
  const portal = new THREE.Mesh(new THREE.TorusGeometry(2.05, .36, 32, 100), blue);
  portal.position.set(.15, .2, -.9);
  portal.rotation.set(.45, -.55, -.2); group.add(portal);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(3.75, .014, 8, 130), new THREE.MeshStandardMaterial({ color:'#92a2d4', roughness:.25, metalness:.6 }));
  orbit.rotation.set(1.1, -.45, .18); orbit.position.set(.1, -.3, -.1); group.add(orbit);
  const innerOrbit = new THREE.Mesh(new THREE.TorusGeometry(2.7, .017, 8, 100), white);
  innerOrbit.rotation.set(.4, .7, -.3); innerOrbit.position.set(.15, .2, -.9); group.add(innerOrbit);
  const loader = new THREE.TextureLoader();
  const urls: string[] = JSON.parse(root.dataset.covers || '[]');
  const textures = await Promise.all(urls.map(url => loader.loadAsync(url)));
  const animated: { object: THREE.Object3D; y: number; rotation: number; phase: number }[] = [];
  const configs = [
    { p: [.55,.05,1], r: [-.09,-.3,-.17], w: 3.2, h: 2.4 },
    { p: [-3.05,.65,-.25], r: [.08,.42,.19], w: 2.65, h: 1.85 },
    { p: [3.2,.8,-.8], r: [-.1,-.48,-.17], w: 2.35, h: 1.6 },
    { p: [-1.85,-1.35,1.3], r: [.07,.35,.1], w: 2, h: 1.4 },
  ];
  const resources: (THREE.Texture | THREE.Material | THREE.BufferGeometry)[] = [];
  textures.forEach((texture, index) => {
    const config = configs[index];
    // Crop the artwork to the panel, preserving its aspect ratio.
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const image = texture.image;
    const imageAspect = image.width / image.height;
    const panelAspect = config.w / config.h;
    if (imageAspect > panelAspect) { texture.repeat.x = panelAspect / imageAspect; texture.offset.x = (1-texture.repeat.x)/2; }
    else { texture.repeat.y = imageAspect / panelAspect; texture.offset.y = (1-texture.repeat.y)/2; }
    const frame = new THREE.Group();
    const geometry = new RoundedBoxGeometry(config.w + .14, config.h + .14, .16, 4, .065);
    frame.add(new THREE.Mesh(geometry, index % 2 ? blue : white));
    const faceGeometry = new THREE.PlaneGeometry(config.w, config.h);
    const faceMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    const face = new THREE.Mesh(faceGeometry, faceMaterial); face.position.z = .086; frame.add(face);
    frame.position.set(...config.p as [number,number,number]);
    frame.rotation.set(...config.r as [number,number,number]);
    group.add(frame);
    animated.push({ object: frame, y: frame.position.y, rotation: frame.rotation.z, phase: index * 1.8 });
    resources.push(texture, geometry, faceGeometry, faceMaterial);
  });
  // Language tiles are true 3D rounded blocks with canvas-drawn glyphs.
  await document.fonts.ready;
  function letterTile(letter: string, color: string, material: THREE.Material, position: [number,number,number], rotation: [number,number,number], size = 1) {
    const tile = new THREE.Group();
    const geometry = new RoundedBoxGeometry(size, size, .25, 5, .12);
    tile.add(new THREE.Mesh(geometry, material));
    const label = document.createElement('canvas'); label.width = label.height = 256;
    const context = label.getContext('2d')!;
    context.fillStyle = color; context.font = `600 195px ${letter === 'ก' ? '"IBM Plex Sans Thai"' : 'Inter'}, sans-serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(letter, 128, letter === 'ก' ? 140 : 138);
    const texture = new THREE.CanvasTexture(label); texture.colorSpace = THREE.SRGBColorSpace;
    const faceGeometry = new THREE.PlaneGeometry(size * .85, size * .85);
    const faceMaterial = new THREE.MeshBasicMaterial({ map:texture, transparent:true, depthWrite:false });
    const face = new THREE.Mesh(faceGeometry, faceMaterial); face.position.z = .131; tile.add(face);
    tile.position.set(...position); tile.rotation.set(...rotation); group.add(tile);
    animated.push({ object:tile, y:tile.position.y, rotation:tile.rotation.z, phase:4.5+position[0] });
    resources.push(geometry, texture, faceGeometry, faceMaterial);
  }
  letterTile('ก', '#3548ff', white, [-1.5,1.85,.55], [.1,.2,-.2], 1.05);
  letterTile('A', '#f3f4ff', blue, [3.15,-1.45,.7], [.15,-.3,.18], 1.12);
  letterTile('↗', '#ffffff', dark, [-3.75,-1.3,-.4], [.2,.35,-.15], .65);
  for (const [x,y,z,r] of [[2.4,2.1,-.3,.16],[-3.8,1.8,-1,.11],[.7,-2.3,.1,.09]]) {
    const sphereGeometry = new THREE.SphereGeometry(r,24,16); const sphere = new THREE.Mesh(sphereGeometry, blue);
    sphere.position.set(x,y,z); group.add(sphere); resources.push(sphereGeometry);
  }
  // A soft contact shadow grounds the sculpture without an expensive shadow pass.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(45,58,110,.24)'); gradient.addColorStop(1,'rgba(45,58,110,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,128,128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeometry = new THREE.PlaneGeometry(9,3);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map:shadowTexture, transparent:true, depthWrite:false });
  const shadow = new THREE.Mesh(shadowGeometry,shadowMaterial); shadow.position.set(0,-2.25,-1); shadow.rotation.x = -1.12; group.add(shadow);
  resources.push(shadowTexture,shadowGeometry,shadowMaterial);
  let width = 0, height = 0;
  function resize() {
    width = root.clientWidth; height = root.clientHeight;
    renderer.setSize(width,height,false); camera.aspect = width / height; camera.updateProjectionMatrix();
    camera.position.z = camera.aspect >= 2.4 ? 9.9 : 11.8;
    camera.lookAt(0,0,0);
    const spread = THREE.MathUtils.clamp((camera.aspect-2)*.8,0,1.35);
    animated[1].object.position.x=-3.05-spread;
    animated[2].object.position.x=3.2+spread;
    animated[3].object.position.x=-1.85-spread*.3;
    animated[5].object.position.x=3.15+spread*.6;
    const scale = camera.aspect < 1.2 ? .64 : camera.aspect < 1.6 ? .82 : 1;
    group.scale.setScalar(scale);
    renderer.render(scene,camera);
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(root); resize();
  const pointer = { x:0,y:0 }; const current = { x:0,y:0 };
  function onPointer(event: PointerEvent) { if (event.pointerType === 'touch') return; const rect = root.getBoundingClientRect(); pointer.x = (event.clientX-rect.left)/rect.width-.5; pointer.y = (event.clientY-rect.top)/rect.height-.5; }
  function onLeave() { pointer.x=0;pointer.y=0; }
  root.addEventListener('pointermove',onPointer); root.addEventListener('pointerleave',onLeave);
  gsap.registerPlugin(ScrollTrigger);
  let scrollProgress = .5;
  const scrollTrigger = ScrollTrigger.create({ trigger:root, start:'top bottom',end:'bottom top',onUpdate:self => { scrollProgress=self.progress; } });
  let frameId = 0, running = false, time = 0, previous = 0, destroyed = false;
  function render(timestamp: number) {
    if (!running || destroyed) return;
    const delta = Math.min((timestamp-previous)/1000 || .016,.05); previous=timestamp; time+=delta;
    current.x += (pointer.x-current.x)*.045; current.y += (pointer.y-current.y)*.045;
    group.rotation.y = current.x*.17 + (scrollProgress-.5)*.12;
    group.rotation.x = current.y*.08;
    group.position.y = (scrollProgress-.5)*.25;
    portal.rotation.z = -.2+Math.sin(time*.15)*.12;
    innerOrbit.rotation.z = -.3+time*.025;
    for (const item of animated) { item.object.position.y=item.y+Math.sin(time*.55+item.phase)*.085; item.object.rotation.z=item.rotation+Math.sin(time*.32+item.phase)*.018; }
    renderer.render(scene,camera); frameId=requestAnimationFrame(render);
  }
  return {
    setRunning(value: boolean) {
      if (destroyed || running === value) return;
      running=value;root.dataset.running=String(value);
      if (running) { previous=0;scrollTrigger.enable();frameId=requestAnimationFrame(render); }
      else { cancelAnimationFrame(frameId);scrollTrigger.disable(false); }
    },
    dispose() {
      destroyed=true;running=false;cancelAnimationFrame(frameId);resizeObserver.disconnect();scrollTrigger.kill();
      root.removeEventListener('pointermove',onPointer);root.removeEventListener('pointerleave',onLeave);
      portal.geometry.dispose();orbit.geometry.dispose();innerOrbit.geometry.dispose();
      (orbit.material as THREE.Material).dispose();blue.dispose();white.dispose();dark.dispose();
      resources.forEach(resource => resource.dispose());environment.dispose();renderer.dispose();
    },
  };
}
