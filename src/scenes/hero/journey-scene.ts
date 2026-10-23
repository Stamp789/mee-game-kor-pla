import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { dampJourney, journeyRailProgress } from './journey-motion';
import { renderPixelRatio } from './render-budget';

export async function createJourneyScene(stage: HTMLElement, images: string, onProgress: (progress: number) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas: stage.querySelector('canvas')!, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(renderPixelRatio(stage.clientWidth, stage.clientHeight, devicePixelRatio));
  renderer.setClearColor('#060e12');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#060e12', .028);
  scene.environmentIntensity = .7;
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 80);
  const environmentRoom = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentRoom, .06);
  scene.environment = environment.texture;
  environmentRoom.dispose(); pmrem.dispose();
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .6, .6, 1.08);
  composer.addPass(bloom); composer.addPass(new OutputPass());
  const textures: THREE.Texture[] = [];
  const resources = new Set<{ dispose: () => void }>([environment]);
  function releaseResources() {
    textures.forEach(texture => resources.add(texture));
    scene.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) resources.add(mesh.geometry);
      if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => resources.add(material));
    });
    resources.forEach(resource => resource.dispose());
    composer.passes.forEach(pass => pass.dispose()); composer.dispose(); renderer.dispose();
  }
  let disposed = false, running = false, frameId = 0, time = 0, lastTime = 0;
  let targetProgress = 0, progress = 0, progressVelocity = 0, mobile = stage.clientWidth < 700;
  const clamp = THREE.MathUtils.clamp;
  const smooth = (a: number, b: number, p: number) => THREE.MathUtils.smoothstep(p, a, b);
  let seed = 156;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };

  scene.add(new THREE.AmbientLight('#8aa9ce', .5));
  const cyan = new THREE.DirectionalLight('#d0f7ff', 3.8); cyan.position.set(-4, 6, 4); scene.add(cyan);
  const violet = new THREE.DirectionalLight('#bd9bff', 1.7); violet.position.set(4, 2, 5); scene.add(violet);
  const blue = new THREE.PointLight('#677dff', 55, 18); blue.position.set(2, .8, 2); scene.add(blue);
  const gold = new THREE.PointLight('#ffd48b', 42, 14); gold.position.set(-2, -2, 3); scene.add(gold);
  const back = new THREE.PointLight('#79ffe3', 65, 18); back.position.set(0, 0, -3); scene.add(back);
  const chrome = new THREE.MeshPhysicalMaterial({ color: '#a0c1df', metalness: .92, roughness: .23, clearcoat: 1, envMapIntensity: 1.45, emissive: '#153445', emissiveIntensity:.24, iridescence: .85, iridescenceIOR: 1.4, transparent: true });
  const paleChrome = chrome.clone(); paleChrome.color.set('#bad9d7'); paleChrome.roughness = .23;
  const filament = new THREE.MeshStandardMaterial({ color: '#99d8e8', metalness: .6, roughness: .25, emissive: '#79d7ef', emissiveIntensity: .5, transparent: true });
  const organism = new THREE.Group(); organism.position.set(0, .25, 0); scene.add(organism);
  const emblem = new THREE.Group(); emblem.position.y = .9; organism.add(emblem);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, .049, 14, 130), chrome);
  ring.scale.y = 1.19; ring.rotation.set(.08, -.25, -.15); emblem.add(ring);
  const ringEdge = new THREE.Mesh(new THREE.TorusGeometry(1.085, .009, 6, 130), filament);
  ringEdge.scale.y = 1.18; ringEdge.rotation.copy(ring.rotation); emblem.add(ringEdge);

  // An original sculptural G for Game, with an open counter and a clear crossbar.
  const glyph = new THREE.Shape();
  glyph.moveTo(.50, .42);
  glyph.bezierCurveTo(.28, .72, -.18, .76, -.47, .49);
  glyph.bezierCurveTo(-.78, .20, -.76, -.30, -.47, -.57);
  glyph.bezierCurveTo(-.18, -.84, .28, -.77, .55, -.50);
  glyph.lineTo(.55, .05); glyph.lineTo(.04, .05);
  glyph.lineTo(.04, -.17); glyph.lineTo(.32, -.17); glyph.lineTo(.32, -.39);
  glyph.bezierCurveTo(.12, -.56, -.15, -.57, -.32, -.40);
  glyph.bezierCurveTo(-.50, -.22, -.50, .15, -.32, .34);
  glyph.bezierCurveTo(-.14, .53, .14, .53, .33, .28);
  glyph.lineTo(.50, .42); glyph.closePath();
  const glyphMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(glyph, { depth: .13, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: .035, bevelThickness: .035, curveSegments: 30 }), chrome);
  glyphMesh.position.set(.03, .06, -.02); glyphMesh.rotation.y = -.1; emblem.add(glyphMesh);

  const tendrils: THREE.Mesh[] = [];
  for (let j = 0; j < 3; j++) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 70; i++) {
      const t = i / 70, angle = t * Math.PI * 2.1 + j * 2.1;
      const radius = .22 + Math.sin(t * Math.PI) * .66;
      points.push(new THREE.Vector3(Math.sin(angle) * radius, -2.65 + t * 2.75, Math.cos(angle) * radius * .48));
    }
    const strand = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 110, j === 0 ? .037 : .021, 7, false), j === 0 ? paleChrome : chrome);
    organism.add(strand); tendrils.push(strand);
  }
  // Twisting ribbons retain their depth as the camera orbits the sculpture.
  const ribbons = new THREE.Group(); organism.add(ribbons);
  for (let j = 0; j < 2; j++) {
    const points = Array.from({length: 91}, (_, i) => {
      const t = i / 90, a = t * Math.PI * 2.25 + j * Math.PI;
      return new THREE.Vector3(Math.sin(a) * (.35 + Math.sin(t * Math.PI) * .8), -2.5 + t * 2.7, Math.cos(a) * .6);
    });
    const curve = new THREE.CatmullRomCurve3(points);
    const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .009, 5, false), filament); ribbons.add(ribbon);
  }

  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 96;
  const context = glowCanvas.getContext('2d')!;
  const glowGradient = context.createRadialGradient(48, 48, 0, 48, 48, 48);
  glowGradient.addColorStop(0, '#9fdce533'); glowGradient.addColorStop(.3, '#3b879b16'); glowGradient.addColorStop(1, '#18556500');
  context.fillStyle = glowGradient; context.fillRect(0, 0, 96, 96);
  const glowTexture = new THREE.CanvasTexture(glowCanvas); resources.add(glowTexture);
  const haloMat = new THREE.SpriteMaterial({map: glowTexture, transparent: true, opacity:.22, depthWrite: false, blending: THREE.AdditiveBlending});
  const halo = new THREE.Sprite(haloMat); halo.scale.set(11, 13, 1); halo.position.set(0, .1, -3.2); scene.add(halo);

  // Luminous spores rise in branching streams from the forest floor.
  const pointCount = mobile ? 4200 : 8500;
  const positions = new Float32Array(pointCount * 3), colors = new Float32Array(pointCount * 3), sizes = new Float32Array(pointCount);
  const phases = new Float32Array(pointCount);
  const color = new THREE.Color();
  for (let i = 0; i < pointCount; i++) {
    const t = random(), angle = random() * Math.PI * 2;
    const radius = Math.pow(random(), .55) * (1.4 + (1 - t) * 3.3);
    positions[i*3] = Math.cos(angle) * radius + Math.sin(t * 8 + angle * 2) * .38;
    positions[i*3+1] = -3.35 + Math.pow(t, 1.5) * 4.5;
    positions[i*3+2] = Math.sin(angle) * radius * .6 - 1.4;
    color.set(['#8ceeff', '#a8b2ff', '#ffe4a2', '#8cffe0'][Math.floor(random()*4)]);
    color.multiplyScalar(.4 + random() * .95); colors.set([color.r, color.g, color.b], i*3);
    sizes[i] = .85 + Math.pow(random(), 3) * 7; phases[i] = random() * Math.PI * 2;
  }
  const sporesGeo = new THREE.BufferGeometry();
  sporesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  sporesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sporesGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  sporesGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const sporeMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDensity: { value: 1 }, uPixelRatio: { value: renderer.getPixelRatio() }, uSizeScale: { value: 1 }, uBrightness: { value: 1 }, uMaxSize: { value: 16 } },
    vertexShader: `attribute float aSize;attribute float aPhase;attribute vec3 color;varying vec3 vColor;varying float vGlow;varying float vDepth;uniform float uTime;uniform float uPixelRatio;uniform float uSizeScale;uniform float uMaxSize;
    void main(){vec3 p=position;p.x+=sin(uTime*.22+aPhase+p.y*.8)*.13;p.y+=sin(uTime*.3+aPhase)*.09;p.z+=cos(uTime*.18+aPhase)*.08;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uPixelRatio*20.*uSizeScale/max(2.,-mv.z),.8,uMaxSize);vColor=color;vGlow=.78+.22*sin(aPhase+uTime*.4);vDepth=smoothstep(.7,2.8,-mv.z);}`,
    fragmentShader: `varying vec3 vColor;varying float vGlow;varying float vDepth;uniform float uDensity;uniform float uBrightness;void main(){float d=length(gl_PointCoord-.5);float core=exp(-d*d*60.);float halo=exp(-d*d*13.);float a=(core*.7+halo*.28)*(1.-smoothstep(.34,.5,d));gl_FragColor=vec4(vColor*(1.+core*.6)*uBrightness,a*vGlow*uDensity*vDepth);}`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const spores = new THREE.Points(sporesGeo, sporeMaterial); scene.add(spores);
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(1800 * 3), dustColor = new Float32Array(1800 * 3), dustSize = new Float32Array(1800), dustPhase = new Float32Array(1800);
  for (let i = 0; i < 1800; i++) {
    dustPos.set([(random()-.5)*32,(random()-.5)*20,(random()-.5)*38-5],i*3);
    dustColor.set([.16+random()*.2,.28+random()*.2,.3+random()*.25],i*3);dustSize[i]=.5+random()*1.5;dustPhase[i]=random()*6;
  }
  dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));dustGeo.setAttribute('color',new THREE.BufferAttribute(dustColor,3));dustGeo.setAttribute('aSize',new THREE.BufferAttribute(dustSize,1));dustGeo.setAttribute('aPhase',new THREE.BufferAttribute(dustPhase,1));
  const dustMaterial = sporeMaterial.clone();
  dustMaterial.uniforms.uBrightness.value=.55;dustMaterial.uniforms.uSizeScale.value=.7;
  const dust = new THREE.Points(dustGeo,dustMaterial);scene.add(dust);

  // A sparse near-field layer adds parallax and soft, larger bokeh around the edges.
  const foregroundCount=mobile?85:160;
  const foregroundGeo=new THREE.BufferGeometry();
  const foregroundPos=new Float32Array(foregroundCount*3),foregroundColor=new Float32Array(foregroundCount*3),foregroundSize=new Float32Array(foregroundCount),foregroundPhase=new Float32Array(foregroundCount);
  for(let i=0;i<foregroundCount;i++){
    const side=i%2?1:-1;
    foregroundPos.set([side*(2.5+random()*7),(random()-.5)*10,3+random()*6],i*3);
    color.set(i%3===0?'#ffe1a0':i%3===1?'#93d8ff':'#bca6ff');
    foregroundColor.set([color.r,color.g,color.b],i*3);foregroundSize[i]=3+random()*9;foregroundPhase[i]=random()*6;
  }
  foregroundGeo.setAttribute('position',new THREE.BufferAttribute(foregroundPos,3));foregroundGeo.setAttribute('color',new THREE.BufferAttribute(foregroundColor,3));foregroundGeo.setAttribute('aSize',new THREE.BufferAttribute(foregroundSize,1));foregroundGeo.setAttribute('aPhase',new THREE.BufferAttribute(foregroundPhase,1));
  const foregroundMaterial=sporeMaterial.clone();foregroundMaterial.uniforms.uBrightness.value=.55;foregroundMaterial.uniforms.uDensity.value=.46;foregroundMaterial.uniforms.uMaxSize.value=32;
  const foreground=new THREE.Points(foregroundGeo,foregroundMaterial);scene.add(foreground);

  const blooms: {group: THREE.Group; phase: number; baseY: number}[] = [];
  for (let j = 0; j < 7; j++) {
    const group = new THREE.Group(); const side = j%2 ? 1 : -1;
    group.position.set(side * (2.2+random()*3.6), -1.3+random()*2.1, -1+random()*3);
    const s=.17+random()*.2; group.scale.setScalar(s); group.rotation.z=side*(.12+random()*.3);
    const shellMaterial = new THREE.MeshPhysicalMaterial({color:'#8cc9dd',metalness:.4,roughness:.22,emissive:'#287589',emissiveIntensity:.3,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false,clearcoat:1});
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1,24,10,0,Math.PI*2,0,Math.PI/2),shellMaterial);cap.scale.y=.42;group.add(cap);
    const capRim=new THREE.Mesh(new THREE.TorusGeometry(1,.012,5,60),filament);capRim.rotation.x=Math.PI/2;group.add(capRim);
    for(let k=0;k<9;k++){
      const angle=k/9*Math.PI*2;
      const pts=Array.from({length:14},(_,i)=>{const t=i/13;return new THREE.Vector3(Math.cos(angle)*(.6-t*.22)+Math.sin(t*5+k)*.07,-t*(1.8+random()*.25),Math.sin(angle)*(.6-t*.22));});
      const tail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),22,.006,4,false),filament);group.add(tail);
    }
    scene.add(group);blooms.push({group,phase:random()*6,baseY:group.position.y});
  }
  for(let i=0;i<6;i++){
    const ripple=new THREE.Mesh(new THREE.TorusGeometry(1+i*.85,.005,4,140),new THREE.MeshBasicMaterial({color:'#5796a0',transparent:true,opacity:.11-i*.013}));
    ripple.rotation.x=Math.PI/2;ripple.position.set(0,-3.42+i*.001,0);scene.add(ripple);
  }

  // Real game imagery lives in the scene's depth; it is revealed by the camera path.
  const loader=new THREE.TextureLoader();
  const loaded=await Promise.allSettled((JSON.parse(images) as string[]).map(url=>loader.loadAsync(url)));
  loaded.forEach(result=>{if(result.status==='fulfilled')textures.push(result.value);});
  if(loaded.some(result=>result.status==='rejected')){
    releaseResources();throw new Error('World imagery failed to load');
  }
  const worlds: THREE.Group[]=[];
  const worldMaterials: THREE.MeshBasicMaterial[]=[];
  const worldPos=[new THREE.Vector3(2.9,.8,-8),new THREE.Vector3(6.5,2.5,-15),new THREE.Vector3(3.8,-2.3,-12)];
  textures.forEach((texture,i)=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    const group=new THREE.Group();group.position.copy(worldPos[i]);group.rotation.y=[-.19,-.25,.15][i];group.rotation.z=[.025,-.03,.025][i];
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:0,color:'#cbe6ee',side:THREE.DoubleSide});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(4.5,2.535),material);group.add(plane);
    const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.57,2.605)),new THREE.LineBasicMaterial({color:'#669da6',transparent:true,opacity:0}));frame.position.z=-.01;group.add(frame);
    scene.add(group);worlds.push(group);worldMaterials.push(material);
  });
  const pointer={x:0,y:0};
  const onPointer=(event:PointerEvent)=>{if(event.pointerType==='touch')return;const rect=stage.getBoundingClientRect();pointer.x=(event.clientX-rect.left)/rect.width-.5;pointer.y=(event.clientY-rect.top)/rect.height-.5;};
  const resetPointer=()=>{pointer.x=pointer.y=0;};
  stage.addEventListener('pointermove',onPointer);stage.addEventListener('pointerleave',resetPointer);
  const cameraTarget=new THREE.Vector3();
  const cameraPosition=new THREE.Vector3();
  const cameraRail=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,.9,13.4),new THREE.Vector3(-.35,1.15,12.8),
    new THREE.Vector3(1.2,1.4,11.3),new THREE.Vector3(2.5,1.2,9),
    new THREE.Vector3(2.25,1.05,6.5),new THREE.Vector3(1.6,1.05,3.3),new THREE.Vector3(1.05,1,-.25),
  ],false,'centripetal');
  const gazeRail=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,.15,0),new THREE.Vector3(.15,.35,-.4),new THREE.Vector3(.1,.55,-2),new THREE.Vector3(.2,.7,-5),new THREE.Vector3(.1,.7,-10),
  ],false,'centripetal');
  const easedPointer={x:0,y:0};
  let frames=0, quality=1, intervalAverage=1/60, qualitySamples=0;
  function render(now:number, immediate=false){
    if(disposed)return;
    const delta=Math.min(Math.max((now-lastTime)/1000,0),.1);lastTime=now;
    if(running && !immediate && delta > 0){
      intervalAverage += (delta - intervalAverage) * .025;
      if(++qualitySamples >= 180){
        stage.dataset.frameIntervalMs = (intervalAverage * 1000).toFixed(1);
        if(intervalAverage > .027 && quality > .65){quality=Math.max(.65,quality*.82);resize();}
        qualitySamples=0;
      }
    }
    if(running)time+=Math.min(delta,.05);
    if(immediate){progress=targetProgress;progressVelocity=0;}
    else{const follow=dampJourney(progress,targetProgress,progressVelocity,delta);progress=follow.value;progressVelocity=follow.velocity;}
    onProgress(progress);
    const crossing=smooth(.5,1,progress);
    const sculptureOpacity=1-smooth(.66,.85,progress);
    chrome.opacity=sculptureOpacity;paleChrome.opacity=sculptureOpacity;filament.opacity=sculptureOpacity;
    organism.visible=sculptureOpacity>.005;
    haloMat.opacity=.22*(1-crossing);
    const railProgress=journeyRailProgress(progress);
    cameraRail.getPointAt(railProgress,cameraPosition);
    gazeRail.getPointAt(smooth(.27,1,progress),cameraTarget);
    easedPointer.x=THREE.MathUtils.damp(easedPointer.x,pointer.x,7,delta);
    easedPointer.y=THREE.MathUtils.damp(easedPointer.y,pointer.y,7,delta);
    camera.position.set(cameraPosition.x*(mobile?.3:1)+easedPointer.x*.2,cameraPosition.y-easedPointer.y*.12,cameraPosition.z);
    const desiredFov=(mobile?52:38)+Math.sin(progress*Math.PI)*1.8+smooth(.66,1,progress)*2;
    if(Math.abs(camera.fov-desiredFov)>.005){camera.fov=desiredFov;camera.updateProjectionMatrix();}
    camera.lookAt(cameraTarget);
    organism.rotation.y=-.18+Math.sin(time*.17)*.12+progress*Math.PI*.85;
    organism.rotation.z=Math.sin(time*.13)*.025;
    organism.position.y=.25+Math.sin(time*.35)*.065;
    ring.rotation.y=-.25+Math.sin(time*.23)*.12;
    ribbons.rotation.y=Math.sin(time*.14)*.2;
    spores.rotation.y=time*.018+progress*.18;
    sporeMaterial.uniforms.uTime.value=time;sporeMaterial.uniforms.uDensity.value=1-crossing*.85;
    dustMaterial.uniforms.uTime.value=time;dust.rotation.y=time*.002;
    foregroundMaterial.uniforms.uTime.value=time;foregroundMaterial.uniforms.uDensity.value=.46*(1-crossing*.7);
    violet.intensity=1.7+Math.sin(time*.24)*.18;
    blooms.forEach(({group,phase,baseY})=>{group.position.y=baseY+Math.sin(time*.35+phase)*.06;group.rotation.z=Math.sin(time*.18+phase)*.12;});
    worlds.forEach((world,i)=>{
      world.position.x=worldPos[i].x*(mobile?.35:1);
      world.position.y=worldPos[i].y+Math.sin(time*.26+i)*.06-(mobile?1.2:0);
      world.scale.setScalar(mobile?.68:1);
      const opacity=smooth(.53,.83,progress)*.96;
      worldMaterials[i].opacity=opacity;
      (world.children[1] as THREE.LineSegments<THREE.EdgesGeometry,THREE.LineBasicMaterial>).material.opacity=opacity*.4;
    });
    composer.render();
    if(++frames%15===0||immediate){stage.dataset.camera=camera.position.toArray().map(v=>v.toFixed(2)).join(',');stage.dataset.renderProgress=progress.toFixed(3);}
    if(running)frameId=requestAnimationFrame(render);
  }
  const resize=()=>{
    const {width,height}=stage.getBoundingClientRect();mobile=width<700;
    if(!width||!height)return;
    const ratio=renderPixelRatio(width,height,devicePixelRatio,quality);
    renderer.setPixelRatio(ratio);composer.setPixelRatio(ratio);
    renderer.setSize(width,height,false);composer.setSize(width,height);
    stage.dataset.renderPixelRatio=ratio.toFixed(2);
    camera.aspect=width/height;camera.fov=mobile?52:40;camera.updateProjectionMatrix();
    if(!running){lastTime=performance.now();render(lastTime,true);}
  };
  const observer=new ResizeObserver(resize);observer.observe(stage);resize();
  return {
    setRunning(value:boolean){
      if(disposed||value===running)return;running=value;
      if(running){lastTime=performance.now();intervalAverage=1/60;qualitySamples=0;frameId=requestAnimationFrame(render);}else cancelAnimationFrame(frameId);
    },
    setProgress(value:number){targetProgress=clamp(value,0,1);if(!running){lastTime=performance.now();render(lastTime,true);}},
    dispose(){
      disposed=true;running=false;cancelAnimationFrame(frameId);observer.disconnect();
      stage.removeEventListener('pointermove',onPointer);stage.removeEventListener('pointerleave',resetPointer);
      releaseResources();
    },
  };
}
