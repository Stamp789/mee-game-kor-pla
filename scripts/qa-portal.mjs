import { mkdir, writeFile } from 'node:fs/promises';
// Local-only DOM diagnostics. Not included in public assets or production builds.
const output = new URL('../dist/__portalqa/', import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL('index.html', output), `<!doctype html><html><meta charset="utf-8"><title>Portal responsive QA</title>
<style>body{margin:0;background:#202127;color:white;font:11px system-ui}header{height:30px;padding:3px 12px;box-sizing:border-box}#box{margin:auto}iframe{border:0;display:block;transform-origin:top left}pre{display:none}</style><header id="label"></header><div id="box"><iframe id="frame" title="Responsive preview"></iframe></div><pre id="metrics"></pre>
<script>
const p=new URLSearchParams(location.search),w=Number(p.get('width'))||1440,h=Number(p.get('height'))||900;
const frame=document.getElementById('frame');frame.width=w;frame.height=h;frame.src=p.get('page')==='journey'?'/preview/journey/':p.get('page')==='catalog'?'/mods/':p.get('page')==='detail'?'/mods/absolum/':'/';
function fit(){const s=Math.min(1,(innerWidth-20)/w,(innerHeight-40)/h);frame.style.transform='scale('+s+')';document.getElementById('box').style.width=w*s+'px';}fit();addEventListener('resize',fit);
frame.addEventListener('load',()=>{const d=frame.contentDocument;function measure(){const cw=d.documentElement.clientWidth;const overflow=[...d.body.querySelectorAll('*')].filter(e=>!e.closest('dialog')&&!e.classList.contains('skip-link')&&e.getBoundingClientRect().right>cw+1).map(e=>({tag:e.tagName,class:e.className,right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)}));document.getElementById('metrics').textContent=JSON.stringify({width:cw,scroll:d.documentElement.scrollWidth,overflow},null,2);document.getElementById('label').textContent=w+' × '+h+' | content '+cw+' / scroll '+d.documentElement.scrollWidth;}measure();new ResizeObserver(measure).observe(d.body);d.fonts.ready.then(measure);});
</script></html>`);
console.log('Portal QA: http://127.0.0.1:4321/__portalqa/?width=390&height=900');
