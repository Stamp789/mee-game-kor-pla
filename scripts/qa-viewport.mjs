import { mkdir, writeFile } from 'node:fs/promises';

// Local QA only. This file is generated in ignored build output, never in public/.
const output = new URL('../dist/__qa/', import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL('index.html', output), `<!doctype html>
<html lang="th"><meta charset="utf-8"><title>มีเกมก็แปล — PC Preview</title>
<style>body{margin:0;background:#202127;font:12px system-ui;color:#fff}header{padding:10px;display:flex;gap:16px;align-items:center}#viewport-box{margin:0 auto}iframe{display:block;border:0;background:#f3f3f6;transform-origin:top left}a{color:#fff}</style>
<header><span id="label"></span><a id="home">หน้าแรก</a><a id="catalog">คลังม็อด</a><a id="detail">Absolum</a><output id="metrics" hidden></output></header>
<div id="viewport-box"><iframe title="Responsive preview" id="preview"></iframe></div>
<script>
const p=new URLSearchParams(location.search);
const width=Math.min(1920,Math.max(320,Number(p.get('width'))||1440));
const height=Math.min(1200,Math.max(600,Number(p.get('height'))||900));
const path=p.get('page')==='detail'?'/mods/absolum/':p.get('page')==='catalog'?'/mods/':'/';
const frame=document.getElementById('preview');
frame.width=String(width);frame.height=String(height);frame.src=path;
document.getElementById('label').textContent=width+' × '+height+' CSS px';
document.getElementById('home').href='?width='+width+'&height='+height;
document.getElementById('detail').href='?width='+width+'&height='+height+'&page=detail';
document.getElementById('catalog').href='?width='+width+'&height='+height+'&page=catalog';
document.getElementById('metrics').hidden=!p.has('inspect');
function fit(){const scale=Math.min(1,(innerWidth-32)/width,(innerHeight-52)/height);frame.style.transform='scale('+scale+')';const box=document.getElementById('viewport-box');box.style.width=width*scale+'px';box.style.height=height*scale+'px';}
fit();addEventListener('resize',fit);
frame.addEventListener('load',()=>{const doc=frame.contentDocument;const measure=()=>{document.getElementById('metrics').textContent='Content '+doc.documentElement.clientWidth+' / Scroll '+doc.documentElement.scrollWidth+' px';};measure();new ResizeObserver(measure).observe(doc.body);});
</script></html>`);
console.log('Local desktop QA: http://127.0.0.1:4321/__qa/?width=1440&height=900');
