import { useState, useRef, useEffect, useCallback } from "react";
import { optimizeSegments, pathsToSegments, segmentsToPaths, getTravelSegments, computeOptStats, dist } from "./optimizer";

// ============================================================
// IMAGE LOADING — supports PNG/JPG/BMP/WebP/TIFF/SVG/GIF
// ============================================================

function loadPixelsFromImg(img, maxSize = 512) {
  const canvas = document.createElement('canvas');
  let w = img.width, h = img.height;
  if (w > maxSize || h > maxSize) {
    const r = Math.min(maxSize/w, maxSize/h);
    w = Math.round(w*r); h = Math.round(h*r);
  }
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h);
  return { pixels: d.data, w, h };
}

// Load any supported image file → HTMLImageElement
function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();

    // SVG: load as image via blob URL
    if (ext === 'svg') {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
      img.onerror = reject;
      img.src = url;
      return;
    }

    // TIFF: use canvas trick via FileReader (basic support)
    if (ext === 'tif' || ext === 'tiff') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('TIFF לא נתמך בדפדפן זה — אנא המר ל-PNG תחילה'));
        img.src = url;
      };
      reader.readAsDataURL(file);
      return;
    }

    // All other formats (PNG, JPG, BMP, WebP, GIF)
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
    img.onerror = () => reject(new Error(`לא ניתן לטעון קובץ: ${file.name}`));
    img.src = url;
  });
}

// ============================================================
// COLOR QUANTIZATION
// ============================================================

function colorDist(r1,g1,b1,r2,g2,b2) {
  return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2);
}

function kMeans(pixels, w, h, k, iters=12) {
  const samples = [];
  for (let i=0; i<w*h; i++) {
    if (pixels[i*4+3]<128) continue;
    samples.push([pixels[i*4],pixels[i*4+1],pixels[i*4+2]]);
  }
  if (!samples.length) return [];
  let centroids = Array.from({length:k},(_,i)=>[...samples[Math.floor(i*samples.length/k)]]);
  let labels = new Array(samples.length).fill(0);

  for (let iter=0; iter<iters; iter++) {
    let changed = false;
    for (let i=0; i<samples.length; i++) {
      const [r,g,b]=samples[i];
      let best=0, bd=Infinity;
      for (let c=0; c<k; c++) {
        const d=colorDist(r,g,b,...centroids[c]);
        if (d<bd){bd=d;best=c;}
      }
      if (labels[i]!==best){labels[i]=best;changed=true;}
    }
    if (!changed) break;
    const sums=Array.from({length:k},()=>[0,0,0,0]);
    for (let i=0;i<samples.length;i++){
      sums[labels[i]][0]+=samples[i][0];
      sums[labels[i]][1]+=samples[i][1];
      sums[labels[i]][2]+=samples[i][2];
      sums[labels[i]][3]++;
    }
    centroids=sums.map(([r,g,b,n])=>n>0?[Math.round(r/n),Math.round(g/n),Math.round(b/n)]:[128,128,128]);
  }
  return centroids;
}

function quantize(pixels, w, h, centroids) {
  const labels = new Int16Array(w*h).fill(-1);
  for (let i=0;i<w*h;i++){
    if (pixels[i*4+3]<128) continue;
    const r=pixels[i*4],g=pixels[i*4+1],b=pixels[i*4+2];
    let best=0, bd=Infinity;
    for (let c=0;c<centroids.length;c++){
      const d=colorDist(r,g,b,...centroids[c]);
      if(d<bd){bd=d;best=c;}
    }
    labels[i]=best;
  }
  return labels;
}

// ============================================================
// CONTOUR EXTRACTION + TRACING
// ============================================================

function extractBoundary(labels, w, h, ci) {
  const pts = [];
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    if (labels[y*w+x]!==ci) continue;
    const edge =
      (x===0||labels[y*w+x-1]!==ci)||
      (x===w-1||labels[y*w+x+1]!==ci)||
      (y===0||labels[(y-1)*w+x]!==ci)||
      (y===h-1||labels[(y+1)*w+x]!==ci);
    if (edge) pts.push([x,y]);
  }
  return pts;
}

function traceOrdered(edgePx, w) {
  if (!edgePx.length) return [];
  const map = new Map();
  for (const [x,y] of edgePx) map.set(y*w+x,[x,y]);
  const visited = new Set();
  const paths = [];
  const dx8=[1,1,0,-1,-1,-1,0,1], dy8=[0,1,1,1,0,-1,-1,-1];

  for (const [key,[sx,sy]] of map) {
    if (visited.has(key)) continue;
    const path=[[sx,sy]]; visited.add(key);
    let cx=sx,cy=sy,ext=true;
    while(ext){ext=false;for(let d=0;d<8;d++){const nx=cx+dx8[d],ny=cy+dy8[d],nk=ny*w+nx;if(map.has(nk)&&!visited.has(nk)){visited.add(nk);path.push([nx,ny]);cx=nx;cy=ny;ext=true;break;}}}
    if (path.length>=2) paths.push(path);
  }
  return paths;
}

function rdp(pts, eps) {
  if (pts.length<=2) return pts;
  const [x1,y1]=pts[0],[x2,y2]=pts[pts.length-1];
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
  let maxD=0,maxI=0;
  for (let i=1;i<pts.length-1;i++){
    const [px,py]=pts[i];
    const d=len===0?Math.sqrt((px-x1)**2+(py-y1)**2):Math.abs(dy*px-dx*py+x2*y1-y2*x1)/len;
    if(d>maxD){maxD=d;maxI=i;}
  }
  if (maxD>eps){const L=rdp(pts.slice(0,maxI+1),eps),R=rdp(pts.slice(maxI),eps);return[...L.slice(0,-1),...R];}
  return [pts[0],pts[pts.length-1]];
}

function connectPaths(paths, tol) {
  if (!paths.length) return paths;
  const rem=paths.map(p=>[...p]);
  const out=[];
  while(rem.length){
    let cur=rem.splice(0,1)[0],ext=true;
    while(ext&&rem.length){
      ext=false;
      const tail=cur[cur.length-1],head=cur[0];
      let bi=-1,bd=Infinity,bm='';
      for(let i=0;i<rem.length;i++){
        const p=rem[i],ph=p[0],pt=p[p.length-1];
        const d1=Math.hypot(tail[0]-ph[0],tail[1]-ph[1]);
        const d2=Math.hypot(tail[0]-pt[0],tail[1]-pt[1]);
        const d3=Math.hypot(head[0]-pt[0],head[1]-pt[1]);
        const d4=Math.hypot(head[0]-ph[0],head[1]-ph[1]);
        const best=Math.min(d1,d2,d3,d4);
        if(best<bd){bd=best;bi=i;bm=best===d1?'th':best===d2?'tt':best===d3?'ht':'hh';}
      }
      if(bi>=0&&bd<=tol){
        const nx=rem.splice(bi,1)[0];
        if(bm==='th')cur=[...cur,...nx];
        else if(bm==='tt')cur=[...cur,...nx.reverse()];
        else if(bm==='ht')cur=[...nx,...cur];
        else cur=[...nx.reverse(),...cur];
        ext=true;
      }
    }
    out.push(cur);
  }
  return out;
}

// ============================================================
// GCODE EXPORT
// ============================================================

function generateGcode(layers, feedRate, plungeRate, zSafe, passes) {
  let g=`; Image → G-code\n; CNC Vector Optimizer\nG21\nG90\nG0 Z${zSafe}\n`;
  for (const {color, paths, zDepth} of layers) {
    g+=`\n; Color RGB(${color.join(',')})  Z=${zDepth.toFixed(2)}\n`;
    for (let p=1;p<=passes;p++){
      const z=(zDepth/passes)*p;
      for (const path of paths){
        if(path.length<2) continue;
        g+=`G0 X${path[0][0].toFixed(3)} Y${path[0][1].toFixed(3)}\n`;
        g+=`G1 Z${z.toFixed(3)} F${plungeRate}\n`;
        for (let i=1;i<path.length;i++)
          g+=`G1 X${path[i][0].toFixed(3)} Y${path[i][1].toFixed(3)} F${feedRate}\n`;
        g+=`G0 Z${zSafe}\n`;
      }
    }
  }
  return g+'M2\n';
}

// ============================================================
// PREVIEW CANVAS
// ============================================================

function drawPreview(canvas, layers, visMap, physW, physH, showOpt, optLayers) {
  if (!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#090d18';ctx.fillRect(0,0,W,H);
  if(!layers.length) return;

  const pad=20,sx=(W-pad*2)/physW,sy=(H-pad*2)/physH,sc=Math.min(sx,sy);
  const ox=pad+(W-pad*2-physW*sc)/2,oy=pad+(H-pad*2-physH*sc)/2;
  const tx=x=>ox+x*sc, ty=y=>H-oy-y*sc;

  const source = showOpt ? optLayers : layers;
  for (const layer of source) {
    if (visMap[layer.colorIdx]===false) continue;
    const [r,g,b]=layer.color;
    // Draw travel moves
    let prev = null;
    for (const path of layer.paths) {
      if (prev) {
        const pt=prev[prev.length-1],ph=path[0];
        const d=Math.hypot(pt[0]-ph[0],pt[1]-ph[1]);
        if (d>0.5){
          ctx.strokeStyle='rgba(255,60,60,0.35)';ctx.lineWidth=0.8;ctx.setLineDash([3,3]);
          ctx.beginPath();ctx.moveTo(tx(pt[0]),ty(pt[1]));ctx.lineTo(tx(ph[0]),ty(ph[1]));ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.strokeStyle=`rgb(${r},${g},${b})`;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(tx(path[0][0]),ty(path[0][1]));
      for(let i=1;i<path.length;i++)ctx.lineTo(tx(path[i][0]),ty(path[i][1]));
      ctx.stroke();
      prev=path;
    }
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const FORMATS = '.png,.jpg,.jpeg,.bmp,.webp,.gif,.svg,.tif,.tiff';

export default function ImageToGcode() {
  const [imgSrc, setImgSrc] = useState(null);
  const [rawPixels, setRawPixels] = useState(null);
  const [dims, setDims] = useState({w:0,h:0});
  const [colorLayers, setColorLayers] = useState([]);
  const [optLayers, setOptLayers] = useState([]);
  const [optStats, setOptStats] = useState(null);
  const [showOpt, setShowOpt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const [physW, setPhysW] = useState(100);
  const [physH, setPhysH] = useState(100);
  const [lockAspect, setLockAspect] = useState(true);
  const [numColors, setNumColors] = useState(4);
  const [simplifyEps, setSimplifyEps] = useState(0.5);
  const [connectTol, setConnectTol] = useState(3);
  const [minPts, setMinPts] = useState(3);
  const [feedRate, setFeedRate] = useState(800);
  const [plungeRate, setPlungeRate] = useState(200);
  const [zSafe, setZSafe] = useState(5);
  const [zBase, setZBase] = useState(-0.5);
  const [passes, setPasses] = useState(1);
  const [layerZ, setLayerZ] = useState({});
  const [layerVisible, setLayerVisible] = useState({});

  const previewCanvas = useRef(null);
  const fileInput = useRef(null);

  // Main processing pipeline
  const reprocess = useCallback(() => {
    if (!rawPixels) return;
    setIsProcessing(true); setProcessMsg('קיבוץ צבעים...');
    setTimeout(() => {
      try {
        const { pixels, w, h } = rawPixels;
        const scale = physW / w;

        setProcessMsg('מחלץ אזורי צבע...');
        const centroids = kMeans(pixels, w, h, numColors);
        const labels = quantize(pixels, w, h, centroids);

        setProcessMsg('מייצר נתיבים...');
        const layers = [];
        for (let ci=0; ci<centroids.length; ci++) {
          const edgePx = extractBoundary(labels, w, h, ci);
          if (edgePx.length < minPts) continue;
          const raw = traceOrdered(edgePx, w);
          const simp = raw.map(p=>rdp(p,simplifyEps)).filter(p=>p.length>=2);
          const conn = connectPaths(simp, connectTol);
          // Convert pixel → mm with Y-flip
          const mmPaths = conn.map(p=>p.map(([px,py])=>[px*scale, physH-py*scale]));
          if (mmPaths.length > 0) {
            layers.push({
              colorIdx: ci, color: centroids[ci],
              paths: mmPaths,
              zDepth: layerZ[ci] ?? zBase,
            });
          }
        }
        // Sort by brightness
        layers.sort((a,b)=>(b.color[0]+b.color[1]+b.color[2])-(a.color[0]+a.color[1]+a.color[2]));
        setColorLayers(layers);

        // ---- OPTIMIZATION PASS ----
        setProcessMsg('מבצע אופטימיזציה...');
        const optimized = layers.map(layer => {
          const segs = pathsToSegments(layer.paths, feedRate);
          const optSegs = optimizeSegments(segs);
          const optPaths = segmentsToPaths(optSegs);
          return { ...layer, paths: optPaths, _segs: optSegs };
        });
        setOptLayers(optimized);

        // Compute stats
        const beforeSegs = layers.flatMap(l => pathsToSegments(l.paths, feedRate));
        const afterSegs = optimized.flatMap(l => l._segs);
        setOptStats(computeOptStats(beforeSegs, afterSegs));

      } catch(e) { console.error(e); }
      setIsProcessing(false); setProcessMsg('');
    }, 30);
  }, [rawPixels, numColors, simplifyEps, connectTol, minPts, physW, physH, zBase, layerZ, feedRate]);

  useEffect(() => { reprocess(); }, [reprocess]);

  useEffect(() => {
    const src = showOpt ? optLayers : colorLayers;
    drawPreview(previewCanvas.current, src, layerVisible, physW, physH, showOpt, optLayers);
  }, [colorLayers, optLayers, layerVisible, physW, physH, showOpt]);

  const loadImage = async (file) => {
    setError('');
    const ext = file.name.split('.').pop().toLowerCase();
    const supported = ['png','jpg','jpeg','bmp','webp','gif','svg','tif','tiff'];
    if (!supported.includes(ext)) {
      setError(`פורמט לא נתמך: .${ext} — נתמכים: ${supported.join(', ')}`);
      return;
    }
    setFileName(file.name);
    setColorLayers([]); setOptLayers([]); setOptStats(null);
    setIsProcessing(true); setProcessMsg('טוען תמונה...');
    try {
      const img = await loadImageFile(file);
      const url = URL.createObjectURL(file);
      setImgSrc(url);
      const d = loadPixelsFromImg(img);
      setRawPixels(d);
      setDims({w:d.w,h:d.h});
      if (lockAspect) setPhysH(Math.round(physW*img.height/img.width));
    } catch(e) {
      setError(e.message);
      setIsProcessing(false); setProcessMsg('');
    }
  };

  const handlePhysW = v => { setPhysW(v); if(lockAspect&&dims.w>0) setPhysH(Math.round(v*dims.h/dims.w)); };
  const handlePhysH = v => { setPhysH(v); if(lockAspect&&dims.h>0) setPhysW(Math.round(v*dims.w/dims.h)); };

  const exportGcode = () => {
    const src = showOpt ? optLayers : colorLayers;
    const visLayers = src
      .filter(l=>layerVisible[l.colorIdx]!==false)
      .map(l=>({...l, zDepth: layerZ[l.colorIdx]??zBase}));
    const content = generateGcode(visLayers, feedRate, plungeRate, zSafe, passes);
    const base = fileName.replace(/\.[^.]+$/,'');
    const suffix = showOpt ? '-opt' : '';
    const url = URL.createObjectURL(new Blob([content],{type:'text/plain'}));
    const a=document.createElement('a'); a.href=url; a.download=`${base}${suffix}.gcode`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalLifts = s => s.reduce((a,l)=>a+(l.paths.length-1),0);

  const card={background:'#0d1525',border:'1px solid #1e2d4a',borderRadius:10,padding:'14px 16px',marginBottom:12};
  const row={display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8};
  const lbl={fontSize:13,color:'#6a8aaa'};
  const inp=(c='#00e5ff')=>({width:72,background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'4px 8px',color:c,fontSize:13,textAlign:'center'});
  const sldr={width:'50%'};

  return (
    <div dir="rtl" style={{minHeight:'100vh',background:'#0a0e1a',fontFamily:"'Segoe UI',Arial,sans-serif",fontSize:'15px',color:'#c8d8f0'}}>

      <div style={{borderBottom:'1px solid #1e2d4a',background:'linear-gradient(180deg,#0d1525,#0a0e1a)',padding:'18px 32px',display:'flex',alignItems:'center',gap:16}}>
        <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,#ff6b35,#cc0055)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🖼</div>
        <div>
          <div style={{fontSize:19,fontWeight:700,color:'#e8f4ff'}}>IMAGE → G-CODE</div>
          <div style={{fontSize:12,color:'#4a6a8a',marginTop:2}}>המרת תמונה + אופטימיזציה אוטומטית</div>
        </div>
        {fileName&&<div style={{marginRight:'auto',background:'#111e33',border:'1px solid #1e3050',borderRadius:6,padding:'6px 14px',fontSize:13,color:'#5a8ab0'}}>🖼 {fileName}</div>}
      </div>

      <div style={{padding:'20px 28px',maxWidth:1300,margin:'0 auto',display:'grid',gridTemplateColumns:rawPixels?'300px 1fr':'1fr',gap:20}}>

        {/* LEFT */}
        <div>
          {!rawPixels ? (
            <>
              <div onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)}
                onDrop={e=>{e.preventDefault();setIsDragging(false);if(e.dataTransfer.files[0])loadImage(e.dataTransfer.files[0])}}
                onClick={()=>fileInput.current?.click()}
                style={{border:`2px dashed ${isDragging?'#ff6b35':'#1e3050'}`,borderRadius:12,padding:'64px 24px',textAlign:'center',cursor:'pointer',background:isDragging?'rgba(255,107,53,0.04)':'rgba(13,21,37,0.6)'}}>
                <div style={{fontSize:48,marginBottom:14}}>🖼</div>
                <div style={{fontSize:17,color:'#8ab0d0',marginBottom:8}}>גרור תמונה לכאן</div>
                <div style={{fontSize:13,color:'#3a5470',lineHeight:1.8}}>
                  PNG · JPG · BMP · WebP · GIF<br/>SVG · TIFF
                </div>
              </div>
              {error&&<div style={{marginTop:12,background:'rgba(255,60,60,0.1)',border:'1px solid #ff3c3c44',borderRadius:8,padding:'10px 14px',color:'#ff8080',fontSize:13}}>⚠ {error}</div>}
              <input ref={fileInput} type="file" accept={FORMATS} onChange={e=>{if(e.target.files[0])loadImage(e.target.files[0])}} style={{display:'none'}}/>
            </>
          ) : (
            <>
              {/* Physical size */}
              <div style={card}>
                <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>📐 גודל פיזי (mm)</div>
                <div style={row}><span style={lbl}>רוחב:</span><input type="number" value={physW} min={1} max={5000} onChange={e=>handlePhysW(+e.target.value)} style={inp()}/></div>
                <div style={row}><span style={lbl}>גובה:</span><input type="number" value={physH} min={1} max={5000} onChange={e=>handlePhysH(+e.target.value)} style={inp()}/></div>
                <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#4a6a8a',cursor:'pointer'}}>
                  <input type="checkbox" checked={lockAspect} onChange={e=>setLockAspect(e.target.checked)} style={{accentColor:'#00e5ff'}}/>נעל יחס
                </label>
              </div>

              {/* Color + path */}
              <div style={card}>
                <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>🎨 צבע ונתיב</div>
                <div style={row}><span style={lbl}>צבעים: {numColors}</span><input type="range" min={2} max={12} value={numColors} onChange={e=>setNumColors(+e.target.value)} style={sldr}/></div>
                <div style={row}><span style={lbl}>פישוט: {simplifyEps}</span><input type="range" min={0.1} max={5} step={0.1} value={simplifyEps} onChange={e=>setSimplifyEps(+e.target.value)} style={sldr}/></div>
                <div style={row}><span style={lbl}>חיבור: {connectTol}mm</span><input type="range" min={0.5} max={30} step={0.5} value={connectTol} onChange={e=>setConnectTol(+e.target.value)} style={sldr}/></div>
                <div style={row}><span style={lbl}>קו מינימלי: {minPts}px</span><input type="range" min={2} max={20} value={minPts} onChange={e=>setMinPts(+e.target.value)} style={sldr}/></div>
              </div>

              {/* Cut */}
              <div style={card}>
                <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✂ פרמטרי חיתוך</div>
                <div style={row}><span style={lbl}>מהירות (mm/min):</span><input type="number" value={feedRate} min={1} onChange={e=>setFeedRate(+e.target.value)} style={inp()}/></div>
                <div style={row}><span style={lbl}>ירידה (mm/min):</span><input type="number" value={plungeRate} min={1} onChange={e=>setPlungeRate(+e.target.value)} style={inp('#ff9900')}/></div>
                <div style={row}><span style={lbl}>Z בטוח:</span><input type="number" value={zSafe} step={0.5} onChange={e=>setZSafe(+e.target.value)} style={inp()}/></div>
                <div style={row}><span style={lbl}>עומק בסיס:</span><input type="number" value={zBase} step={0.1} onChange={e=>setZBase(+e.target.value)} style={inp('#ff5050')}/></div>
                <div style={row}><span style={lbl}>מעברים:</span><input type="number" value={passes} min={1} max={10} onChange={e=>setPasses(+e.target.value)} style={inp('#ff9900')}/></div>
              </div>

              {/* Color layers */}
              {colorLayers.length>0&&(
                <div style={card}>
                  <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>🎨 שכבות — עומק לכל צבע</div>
                  {colorLayers.map((l,i)=>{
                    const [r,g,b]=l.color, vis=layerVisible[l.colorIdx]!==false;
                    return (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:6,opacity:vis?1:0.4}}>
                        <div onClick={()=>setLayerVisible(p=>({...p,[l.colorIdx]:!vis}))}
                          style={{width:18,height:18,borderRadius:3,background:`rgb(${r},${g},${b})`,cursor:'pointer',border:vis?'2px solid #fff':'2px solid #333',flexShrink:0}}/>
                        <span style={{fontSize:11,color:'#4a6a8a',minWidth:55}}>{l.paths.length} קווים</span>
                        <input type="number" value={layerZ[l.colorIdx]??zBase} step={0.1}
                          onChange={e=>setLayerZ(p=>({...p,[l.colorIdx]:+e.target.value}))}
                          style={{...inp('#ff5050'),width:60}}/>
                        <span style={{fontSize:10,color:'#2a4060'}}>mm</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Optimization stats */}
              {optStats&&!isProcessing&&(
                <div style={{...card,background:'rgba(0,229,255,0.04)',border:'1px solid rgba(0,229,255,0.15)'}}>
                  <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>⚡ תוצאות אופטימיזציה</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    {[
                      {l:'הרמות לפני',v:optStats.beforeLifts,c:'#ff9900'},
                      {l:'הרמות אחרי',v:optStats.afterLifts,c:'#00ff88'},
                      {l:'אוויר לפני',v:`${optStats.beforeTravel.toFixed(0)}mm`,c:'#ff5050'},
                      {l:'אוויר אחרי',v:`${optStats.afterTravel.toFixed(0)}mm`,c:'#00e5ff'},
                    ].map((s,i)=>(
                      <div key={i} style={{background:'#080c18',borderRadius:6,padding:'8px 10px'}}>
                        <div style={{fontSize:10,color:'#3a5a7a'}}>{s.l}</div>
                        <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View toggle */}
              {optLayers.length>0&&(
                <div style={{...card,display:'flex',gap:0,padding:4,marginBottom:12}}>
                  {[['מקורי',false],['מאופטם ⚡',true]].map(([label,opt])=>(
                    <button key={label} onClick={()=>setShowOpt(opt)} style={{flex:1,padding:'9px 8px',borderRadius:7,fontSize:13,cursor:'pointer',border:'none',background:showOpt===opt?'rgba(0,229,255,0.15)':'transparent',color:showOpt===opt?'#00e5ff':'#4a6a8a',fontFamily:'inherit',transition:'all 0.15s'}}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Export */}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <button onClick={exportGcode} disabled={isProcessing||!colorLayers.length}
                  style={{padding:'12px 18px',borderRadius:8,fontSize:14,cursor:'pointer',background:'linear-gradient(135deg,#ff6b35,#cc0055)',border:'none',color:'#fff',fontFamily:'inherit',fontWeight:600,opacity:isProcessing?0.6:1}}>
                  {isProcessing?`⚙ ${processMsg}`:`⬇ ייצוא${showOpt?' מאופטם':''} — ${fileName.replace(/\.[^.]+$/,'')}.gcode`}
                </button>
                <button onClick={()=>fileInput.current?.click()} style={{padding:'9px 18px',borderRadius:8,fontSize:13,cursor:'pointer',background:'transparent',border:'1px solid #1e3050',color:'#4a6a8a',fontFamily:'inherit'}}>
                  🖼 החלף תמונה
                </button>
                <input ref={fileInput} type="file" accept={FORMATS} onChange={e=>{if(e.target.files[0])loadImage(e.target.files[0])}} style={{display:'none'}}/>
              </div>
            </>
          )}
        </div>

        {/* RIGHT */}
        {rawPixels&&(
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:'#090d18',border:'1px solid #1a2540',borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid #1a2540',fontSize:12,color:'#3a5a7a',display:'flex',gap:12}}>
                <span>תמונה מקורית</span>
                <span style={{color:'#4a6a8a'}}>{dims.w}×{dims.h}px</span>
                <span style={{color:'#3a5060'}}>{fileName.split('.').pop().toUpperCase()}</span>
              </div>
              {imgSrc&&<img src={imgSrc} alt="" style={{width:'100%',display:'block',maxHeight:180,objectFit:'contain',background:'#111'}}/>}
            </div>
            <div style={{background:'#090d18',border:'1px solid #1a2540',borderRadius:10,overflow:'hidden',flex:1}}>
              <div style={{padding:'9px 14px',borderBottom:'1px solid #1a2540',fontSize:12,color:'#3a5a7a',display:'flex',gap:12,alignItems:'center'}}>
                <span>תצוגה — {showOpt?'מאופטם ⚡':'מקורי'}</span>
                {isProcessing&&<span style={{color:'#ff9900'}}>⚙ {processMsg}</span>}
                {!isProcessing&&<span style={{color:'#2a4060'}}>● לחץ על ריבוע צבע = הסתר/הצג</span>}
              </div>
              <canvas ref={previewCanvas} width={900} height={540} style={{width:'100%',display:'block'}}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}