import { useState, useRef, useEffect } from "react";

// ============================================================
// HERSHEY FONT DATA
// [advanceWidth, [[x1,y1,x2,y2],...]]  cap-height = 21 units
// ============================================================
const seg = pts => pts.reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[]);

const SANS_DATA = {
  ' ':[8,[]],'!':[4,[[2,21,2,7],[2,2,3,2],[3,2,3,1],[3,1,2,1],[2,1,2,2]]],
  '"':[8,[[1,21,1,16],[6,21,6,16]]],"'":[4,[[1,21,1,16]]],
  '(':[6,seg([[4,25],[2,22],[1,18],[0,14],[0,8],[1,4],[2,0],[4,-3]])],')':[6,seg([[0,25],[2,22],[3,18],[4,14],[4,8],[3,4],[2,0],[0,-3]])],
  '*':[10,[[5,21,5,9],[1,18,9,12],[9,18,1,12]]],
  '+':[12,[[6,21,6,0],[1,10,11,10]]],'-':[10,[[1,10,9,10]]],
  '.':[4,seg([[1,1],[1,0],[2,0],[2,1],[1,1]])],',':[4,seg([[2,2],[2,1],[3,1],[3,2],[2,2],[1,0]])],
  '/':[10,[[0,0,10,21]]],'\\':[10,[[0,21,10,0]]],':':[4,seg([[1,12],[1,11],[2,11],[2,12],[1,12],[1,2],[1,1],[2,1],[2,2],[1,2]])],
  ';':[4,seg([[2,12],[2,11],[3,11],[3,12],[2,12],[3,2],[3,1],[4,1],[4,2],[3,2],[2,0]])],'=':[12,[[1,13,11,13],[1,7,11,7]]],
  '<':[12,seg([[11,18],[1,10],[11,2]])],'>':[12,seg([[1,18],[11,10],[1,2]])],
  '?':[10,seg([[1,16],[2,14],[4,12],[7,10],[9,8],[10,5],[10,3],[9,1],[7,0],[5,0],[3,1],[2,2],[9,21],[11,19],[11,16],[9,14],[7,13]])],'!':[4,[[2,21,2,7],[2,2,3,2],[3,2,3,1],[3,1,2,1],[2,1,2,2]]],
  '@':[16,seg([[11,13],[10,15],[8,17],[6,18],[4,18],[2,17],[0,15],[0,9],[1,7],[3,5],[5,4],[7,4],[9,5],[11,7],[12,9],[12,13],[12,17],[11,19],[9,20],[7,20],[5,19],[3,17]])],'#':[12,[[3,21,3,-7],[9,21,9,-7],[0,14,12,14],[0,3,12,3]]],
  '0':[12,seg([[5,21],[3,20],[1,18],[0,16],[0,5],[1,3],[3,1],[5,0],[7,0],[9,1],[11,3],[12,5],[12,16],[11,18],[9,20],[7,21],[5,21],[3,16,9,5]])],'1':[8,[[2,17,5,21],[5,21,5,0]]],
  '2':[12,seg([[1,16],[2,14],[4,12],[7,10],[9,8],[10,5],[10,3],[9,1],[7,0],[5,0],[3,1],[1,3],[0,5],[0,6],[1,8],[3,10],[6,12],[9,15],[10,17],[10,19],[9,21],[7,21],[5,20],[4,19],[3,17]])],'3':[12,seg([[1,20],[3,21],[5,21],[9,19],[10,17],[10,14],[8,11],[5,10],[8,9],[10,6],[10,3],[8,1],[6,0],[4,0],[2,1],[1,2]])],
  '4':[12,[[8,21,8,0],[0,14,12,14],[0,14,8,21]]],'5':[12,seg([[11,20],[9,21],[4,21],[2,19],[1,17],[1,14],[2,12],[4,11],[6,11],[9,12],[11,14],[12,17],[12,19],[11,21],[9,21]])],'6':[12,seg([[9,19],[7,21],[5,21],[3,20],[1,17],[0,13],[0,8],[1,4],[3,1],[6,0],[8,0],[11,1],[13,4],[13,6],[12,9],[10,11],[7,11],[4,10],[1,7]])],'7':[12,[[0,21,12,21],[12,21,3,0]]],'8':[12,seg([[5,0],[3,1],[1,4],[1,6],[2,9],[4,11],[7,11],[10,9],[11,6],[11,4],[9,1],[7,0],[5,0]])],'9':[12,seg([[11,14],[9,12],[7,11],[5,11],[2,12],[0,14],[0,16],[1,19],[3,21],[6,21],[9,20],[11,17],[12,13],[12,8],[11,4],[9,1],[7,0],[4,0],[2,1]])],
  'A':[14,[[0,0,7,21],[14,0,7,21],[3,7,11,7]]],'B':[14,[[0,0,0,21],[0,21,9,21],[12,20,13,17],[13,17,13,14],[13,14,12,12],[12,12,9,11],[9,11,0,11],[0,11,10,11],[13,9,14,6],[14,6,14,3],[14,3,12,1],[12,1,9,0],[9,0,0,0]]],'C':[13,seg([[13,4],[11,2],[9,1],[6,1],[4,2],[2,4],[1,6],[0,9],[0,13],[1,16],[2,18],[4,20],[6,21],[9,21],[11,20],[13,18]])],'D':[14,seg([[0,0,0,21],[0,21,7,21],[10,20],[12,18],[13,16],[14,13],[14,8],[13,5],[12,3],[10,1],[7,0],[0,0]])],'E':[12,[[0,0,0,21],[0,21,11,21],[0,11,7,11],[0,0,11,0]]],'F':[11,[[0,0,0,21],[0,21,11,21],[0,11,7,11]]],'G':[14,seg([[13,18],[11,20],[9,21],[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[9,0],[11,1],[13,3],[13,8],[8,8]])],'H':[14,[[0,0,0,21],[14,0,14,21],[0,11,14,11]]],'I':[4,[[0,0,4,0],[2,0,2,21],[0,21,4,21]]],'J':[11,seg([[0,2],[1,0],[3,0],[5,1],[6,3],[6,21]])],'K':[13,[[0,0,0,21],[13,21,0,8],[5,13,13,0]]],'L':[12,[[0,21,0,0],[0,0,12,0]]],'M':[16,[[0,0,0,21],[0,21,8,7],[8,7,16,21],[16,21,16,0]]],'N':[14,[[0,0,0,21],[0,21,14,0],[14,0,14,21]]],'O':[14,seg([[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[8,0],[10,1],[12,3],[13,5],[14,8],[14,13],[13,16],[12,18],[10,20],[8,21],[6,21]])],'P':[13,seg([[0,0,0,21],[0,21,9,21],[12,20],[13,18],[13,14],[12,12],[9,11],[0,11]])],'Q':[14,[[6,21,4,20],[4,20,2,18],[2,18,1,16],[1,16,0,13],[0,13,0,8],[0,8,1,5],[1,5,2,3],[2,3,4,1],[4,1,6,0],[6,0,8,0],[8,0,10,1],[10,1,12,3],[12,3,13,5],[13,5,14,8],[14,8,14,13],[14,13,13,16],[13,16,12,18],[12,18,10,20],[10,20,8,21],[8,21,6,21],[10,6,14,0]]],'R':[13,seg([[0,0,0,21],[0,21,9,21],[12,20],[13,18],[13,14],[12,12],[9,11],[0,11],[6,11,13,0]])],'S':[12,seg([[12,18],[10,20],[8,21],[5,21],[3,20],[1,18],[1,16],[2,14],[4,12],[9,10],[11,8],[12,6],[12,3],[10,1],[8,0],[5,0],[3,1],[1,3]])],'T':[12,[[6,0,6,21],[0,21,12,21]]],'U':[14,seg([[0,21,0,5],[0,3,1,1],[1,1,3,0],[5,0,9,0],[11,1,13,3],[13,3,14,5],[14,5,14,21]])],'V':[14,[[0,21,7,0],[14,21,7,0]]],'W':[18,[[0,21,4,0],[9,21,4,0],[9,21,14,0],[18,21,14,0]]],'X':[14,[[0,21,14,0],[14,21,0,0]]],'Y':[14,[[0,21,7,11],[7,11,7,0],[14,21,7,11]]],'Z':[14,[[0,21,14,21],[14,21,0,0],[0,0,14,0]]],
  'a':[12,seg([[9,14,9,0],[9,11,7,13],[5,14],[3,14],[1,13],[0,11],[0,9],[1,7],[3,6],[5,6],[7,7],[9,9]])],'b':[12,seg([[0,21,0,0],[0,11,2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]])],'c':[11,seg([[11,11],[9,13],[7,14],[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5]])],'d':[12,seg([[12,21,12,0],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],'e':[11,seg([[0,9,11,9],[11,9,11,11],[10,13,8,14],[6,14],[4,13],[2,11],[1,9],[0,7],[0,5],[1,3],[3,2],[5,2],[7,3],[9,5]])],'f':[7,seg([[5,21],[3,21],[2,20],[1,18],[1,0],[3,14,7,14]])],'g':[12,seg([[12,14,12,-4],[12,-4,10,-6],[8,-7],[6,-7],[4,-6],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],'h':[12,seg([[0,21,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0]])],'i':[4,[[1,21,2,21],[2,21,2,20],[2,20,1,20],[1,20,1,21],[1,14,1,0]]],'j':[5,[[2,21,3,21],[3,21,3,20],[3,20,2,20],[2,20,2,21],[3,14,3,-2],[3,-2,2,-4],[2,-4,0,-5]]],'k':[11,[[0,21,0,0],[0,6,9,14],[4,8,11,0]]],'l':[4,[[0,21,0,0]]],'m':[18,seg([[0,14,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0],[10,10,12,13],[14,14],[17,14],[19,13],[20,10],[20,0]])],'n':[12,seg([[0,14,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0]])],'o':[12,seg([[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5],[12,7],[12,9],[11,11],[9,13],[7,14],[5,14]])],'p':[12,seg([[0,14,0,-7],[0,11,2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]])],'q':[12,seg([[12,14,12,-7],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],'r':[7,[[0,14,0,0],[0,8,2,11],[4,13,6,14],[6,14,8,14]]],'s':[10,seg([[9,11],[7,13],[5,14],[3,14],[1,13],[0,11],[0,9],[1,8],[4,7],[6,6],[8,5],[9,3],[9,2],[8,0],[6,-1],[4,-1],[2,0],[0,2]])],'t':[7,[[2,21,2,3],[2,3,3,1],[3,1,5,0],[5,0,7,0],[0,14,6,14]]],'u':[12,seg([[0,14,0,4],[0,2,1,0],[1,0,3,0],[5,0,7,1],[9,4,10,14],[10,0,10,14]])],'v':[12,[[0,14,6,0],[12,14,6,0]]],'w':[16,[[0,14,4,0],[8,14,4,0],[8,14,12,0],[16,14,12,0]]],'x':[12,[[0,14,12,0],[12,14,0,0]]],'y':[12,[[0,14,6,0],[12,14,6,0],[6,0,5,-2],[5,-2,3,-4],[3,-4,1,-4],[1,-4,0,-3]]],'z':[11,[[0,14,11,14],[11,14,0,0],[0,0,11,0]]],
  // Hebrew — mirrored correctly for RTL rendering
  'א':[14,[[1,0,7,14],[7,14,13,0],[7,14,7,7]]],'ב':[13,[[0,14,10,14],[10,14,13,12],[13,12,13,1],[13,1,0,1],[13,7,6,7]]],'ג':[11,[[0,14,9,14],[9,14,11,12],[11,12,11,0]]],'ד':[13,[[13,0,13,12],[13,12,11,14],[11,14,0,14],[0,14,0,0]]],'ה':[13,[[13,0,13,14],[13,14,0,14],[0,14,0,5],[7,14,7,0]]],'ו':[5,[[2,14,2,0]]],'ז':[9,[[9,14,1,14],[1,14,4,0]]],'ח':[13,[[13,0,13,14],[0,0,0,14],[13,14,0,14]]],'ט':[13,[[13,0,13,14],[13,14,0,14],[0,14,0,0],[6,14,6,5]]],'י':[6,[[1,14,3,12],[3,12,3,0]]],'כ':[12,[[0,14,10,14],[10,14,12,12],[12,12,12,1],[12,1,0,1]]],'ך':[12,[[0,14,10,14],[10,14,12,12],[12,12,12,-5]]],'ל':[11,[[1,14,9,14],[9,14,11,12],[11,12,11,6],[11,6,9,4],[9,4,1,4],[1,4,1,0]]],'מ':[13,[[13,0,13,14],[0,0,0,10],[0,10,6,14],[6,14,13,14],[6,14,6,0]]],'ם':[13,[[13,0,13,14],[0,0,0,14],[13,14,0,14],[13,0,8,0]]],'נ':[11,[[1,14,9,14],[9,14,11,12],[11,12,11,0],[11,14,1,0]]],'ן':[5,[[2,14,2,-4]]],'ס':[13,seg([[6,14],[8,14],[10,13],[13,11],[13,5],[10,3],[8,2],[6,2],[4,2],[2,3],[0,5],[0,9],[2,11],[4,13],[6,14],[6,7,13,7]])],'ע':[13,[[13,14,9,7],[9,7,7,0],[7,0,4,7],[4,7,0,14],[9,7,4,7]]],'פ':[12,[[0,14,9,14],[9,14,12,12],[12,12,12,8],[12,8,9,6],[9,6,4,6],[4,6,4,0],[13,0,4,0]]],'ף':[12,[[0,14,9,14],[9,14,12,12],[12,12,12,8],[12,8,9,6],[9,6,4,6],[4,6,4,-5]]],'צ':[13,[[13,0,9,14],[9,14,5,0],[5,0,1,14],[9,14,1,14]]],'ץ':[13,[[13,0,9,14],[9,14,5,0],[5,0,1,14],[9,14,1,14],[5,0,5,-5]]],'ק':[12,[[12,0,12,14],[12,14,1,14],[1,14,1,5]]],'ר':[11,[[11,0,11,12],[11,12,9,14],[9,14,0,14]]],'ש':[14,[[14,0,14,14],[14,14,7,14],[7,14,7,0],[7,14,0,0]]],'ת':[14,[[14,0,14,14],[14,14,0,14],[0,14,0,5],[7,14,7,0]]],
};

// ============================================================
// FONT VARIANTS
// ============================================================
const SHEAR = 0.22;
function makeItalic(f){const o={};for(const[c,[w,s]]of Object.entries(f))o[c]=[w,s.map(([x1,y1,x2,y2])=>[x1+y1*SHEAR,y1,x2+y2*SHEAR,y2])];return o;}
function makeBold(f,d=0.9){const o={};for(const[c,[w,s]]of Object.entries(f))o[c]=[w+d,[...s,...s.map(([x1,y1,x2,y2])=>[x1+d,y1,x2+d,y2])]];return o;}
function makeGothic(f){
  const o={...f};
  // Override a few chars with angular style
  o['A']=[14,[[0,0,7,21],[14,0,7,21],[2,6,12,6],[0,0,2,0],[14,0,12,0]]];
  o['O']=[14,[[0,0,0,21],[0,21,14,21],[14,21,14,0],[14,0,0,0]]];
  o['E']=[12,[[0,0,0,21],[0,21,12,21],[0,11,9,11],[0,0,12,0]]];
  o['S']=[12,[[12,21,0,21],[0,21,0,11],[0,11,12,11],[12,11,12,0],[12,0,0,0]]];
  return o;
}

const FONTS = {
  sans:   {name:'Sans',   emoji:'A',  data: SANS_DATA},
  italic: {name:'Italic', emoji:'𝘈',  data: makeItalic(SANS_DATA)},
  bold:   {name:'Bold',   emoji:'𝗔',  data: makeBold(SANS_DATA)},
  gothic: {name:'Gothic', emoji:'𝔄',  data: makeGothic(SANS_DATA)},
};

// ============================================================
// SYSTEM FONTS — detected via FontFace API
// ============================================================
const COMMON_SYSTEM_FONTS = [
  'Arial','Verdana','Tahoma','Trebuchet MS','Georgia','Times New Roman',
  'Courier New','Impact','Comic Sans MS','Palatino','Garamond',
  'David','Frank Ruehl','Miriam','Narkisim','Guttman Yad','Arial Hebrew',
  'Segoe UI','Calibri','Cambria','Consolas','Helvetica','Futura',
];

async function getAvailableSystemFonts() {
  const available = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const testStr = 'abcdefghijklmnopqrstuvwxyz0123456789';
  ctx.font = '14px monospace';
  const baseW = ctx.measureText(testStr).width;
  for (const font of COMMON_SYSTEM_FONTS) {
    ctx.font = `14px "${font}", monospace`;
    const w = ctx.measureText(testStr).width;
    if (w !== baseW) available.push(font);
  }
  return available;
}

// ============================================================
// TEXT → STROKES (Hershey)
// ============================================================
const HEB_RE = /[\u05D0-\u05EA]/;

function textToStrokes(text, fontData, fontSizeMm, spacingMm, lineHMm) {
  const scale = fontSizeMm / 21;
  const lines = text.split('\n');
  const out = [];
  lines.forEach((line, li) => {
    const rtl = HEB_RE.test(line);
    const chars = rtl ? Array.from(line).reverse() : Array.from(line);
    let xOff = 0;
    chars.forEach(ch => {
      const [w, segs] = fontData[ch] || fontData[' '] || [8,[]];
      const cW = w * scale;
      segs.forEach(([x1,y1,x2,y2]) => {
        // For RTL Hebrew chars are already pre-mirrored in the font data
        out.push({
          x1: xOff + x1*scale,
          y1: li*lineHMm + y1*scale,
          x2: xOff + x2*scale,
          y2: li*lineHMm + y2*scale,
        });
      });
      xOff += cW + spacingMm;
    });
  });
  return out;
}

// ============================================================
// TEXT → STROKES (System font via canvas skeleton)
// ============================================================
async function systemFontToStrokes(text, fontFamily, fontSizeMm, spacingMm, lineHMm) {
  const PX = 80;
  const scale = fontSizeMm / PX;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  const out = [];

  const lines = text.split('\n');
  lines.forEach((line, li) => {
    const rtl = HEB_RE.test(line);
    const chars = rtl ? Array.from(line).reverse() : Array.from(line);
    let xOff = 0;
    chars.forEach(ch => {
      if (ch === ' ') { xOff += 20*scale + spacingMm; return; }
      ctx.font = `${PX}px "${fontFamily}"`;
      const cW = ctx.measureText(ch).width;
      cv.width = Math.ceil(cW)+4; cv.height = PX+20;
      ctx.clearRect(0,0,cv.width,cv.height);
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,cv.width,cv.height);
      ctx.fillStyle='#000'; ctx.font=`${PX}px "${fontFamily}"`;
      ctx.fillText(ch, 2, PX-5);
      const img = ctx.getImageData(0,0,cv.width,cv.height);
      const W=cv.width, H=cv.height;
      const bin = new Uint8Array(W*H);
      for(let i=0;i<W*H;i++) bin[i]=img.data[i*4]<128?1:0;
      for(let x=0;x<W-1;x++){
        const c1=[],c2=[];
        for(let y=0;y<H;y++){if(bin[y*W+x])c1.push(y);if(bin[y*W+x+1])c2.push(y);}
        if(!c1.length||!c2.length)continue;
        const m1=c1.reduce((a,b)=>a+b,0)/c1.length;
        const m2=c2.reduce((a,b)=>a+b,0)/c2.length;
        out.push({
          x1: xOff+x*scale, y1: li*lineHMm+(PX-m1)*scale,
          x2: xOff+(x+1)*scale, y2: li*lineHMm+(PX-m2)*scale,
        });
      }
      xOff += cW*scale + spacingMm;
    });
  });
  return out;
}

// ============================================================
// EXPORT
// ============================================================
function toGcode(strokes,{feedRate,plungeRate,zSafe,zCut,ox,oy}){
  let g=`; Single-Line Text G-code\nG21\nG90\nG0 Z${zSafe}\n`;
  let px=null,py=null;
  for(const s of strokes){
    const x1=+(s.x1+ox).toFixed(3),y1=+(s.y1+oy).toFixed(3);
    const x2=+(s.x2+ox).toFixed(3),y2=+(s.y2+oy).toFixed(3);
    if(px===null||Math.hypot(px-x1,py-y1)>0.05){g+=`G0 Z${zSafe}\nG0 X${x1} Y${y1}\nG1 Z${zCut} F${plungeRate}\n`;}
    g+=`G1 X${x2} Y${y2} F${feedRate}\n`;
    px=x2;py=y2;
  }
  return g+`G0 Z${zSafe}\nM2\n`;
}

function toSVG(strokes,color){
  if(!strokes.length)return'';
  let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
  strokes.forEach(s=>{mnX=Math.min(mnX,s.x1,s.x2);mnY=Math.min(mnY,s.y1,s.y2);mxX=Math.max(mxX,s.x1,s.x2);mxY=Math.max(mxY,s.y1,s.y2);});
  const p=5,W=mxX-mnX+p*2,H=mxY-mnY+p*2;
  const ls=strokes.map(s=>`<line x1="${(s.x1-mnX+p).toFixed(2)}" y1="${(H-(s.y1-mnY+p)).toFixed(2)}" x2="${(s.x2-mnX+p).toFixed(2)}" y2="${(H-(s.y2-mnY+p)).toFixed(2)}" stroke="${color}" stroke-width="0.5" stroke-linecap="round"/>`).join('\n');
  return`<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}mm" height="${H.toFixed(1)}mm" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">\n${ls}\n</svg>`;
}

// ============================================================
// CANVAS PREVIEW
// ============================================================
function drawCanvas(canvas,strokes){
  if(!canvas)return;
  const W=canvas.clientWidth,H=canvas.clientHeight;
  if(!W||!H)return;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f8f9fa';ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='#e8eaed';ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  if(!strokes.length){ctx.fillStyle='#999';ctx.font='15px Segoe UI';ctx.textAlign='center';ctx.fillText('הכנס טקסט לתצוגה',W/2,H/2);return;}
  let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
  strokes.forEach(s=>{mnX=Math.min(mnX,s.x1,s.x2);mnY=Math.min(mnY,s.y1,s.y2);mxX=Math.max(mxX,s.x1,s.x2);mxY=Math.max(mxY,s.y1,s.y2);});
  const pad=40,bw=mxX-mnX||1,bh=mxY-mnY||1;
  const sc=Math.min((W-pad*2)/bw,(H-pad*2)/bh);
  const ox2=pad+(W-pad*2-bw*sc)/2,oy2=pad+(H-pad*2-bh*sc)/2;
  const tx=x=>ox2+(x-mnX)*sc,ty=y=>H-oy2-(y-mnY)*sc;
  let prev=null;
  for(const s of strokes){
    if(prev&&Math.hypot(prev.x2-s.x1,prev.y2-s.y1)>0.05){
      ctx.strokeStyle='rgba(220,80,80,0.4)';ctx.lineWidth=0.8;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(tx(prev.x2),ty(prev.y2));ctx.lineTo(tx(s.x1),ty(s.y1));ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle='#1a1a2e';ctx.lineWidth=2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(tx(s.x1),ty(s.y1));ctx.lineTo(tx(s.x2),ty(s.y2));ctx.stroke();
    prev=s;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TextToGcode(){
  const [text,setText]=useState('Hello CNC\nשלום עולם');
  const [fontMode,setFontMode]=useState('hershey'); // 'hershey' | 'system' | 'ttf'
  const [hersheyKey,setHersheyKey]=useState('sans');
  const [systemFonts,setSystemFonts]=useState([]);
  const [systemFont,setSystemFont]=useState('Arial');
  const [ttfFace,setTtfFace]=useState(null);
  const [ttfName,setTtfName]=useState('');
  const [fontSizeMm,setFontSizeMm]=useState(10);
  const [spacingMm,setSpacingMm]=useState(1);
  const [lineHMm,setLineHMm]=useState(20);
  const [feedRate,setFeedRate]=useState(800);
  const [plungeRate,setPlungeRate]=useState(200);
  const [zSafe,setZSafe]=useState(5);
  const [zCut,setZCut]=useState(-0.3);
  const [ox,setOx]=useState(0);
  const [oy,setOy]=useState(0);
  const [svgColor,setSvgColor]=useState('#000000');
  const [fileName,setFileName]=useState('text');
  const [strokes,setStrokes]=useState([]);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');

  const canvasRef=useRef(null);
  const ttfRef=useRef(null);
  const importRef=useRef(null);
  const resizeObs=useRef(null);

  // Load system fonts on mount
  useEffect(()=>{getAvailableSystemFonts().then(f=>{setSystemFonts(f);if(f.length)setSystemFont(f[0]);});},[]);

  // Recompute strokes
  useEffect(()=>{
    let cancelled=false;
    const run=async()=>{
      setLoading(true);
      try{
        let s=[];
        if(fontMode==='hershey'){
          const fd=FONTS[hersheyKey]?.data||SANS_DATA;
          s=textToStrokes(text,fd,fontSizeMm,spacingMm,lineHMm);
        } else if(fontMode==='system'&&systemFont){
          s=await systemFontToStrokes(text,systemFont,fontSizeMm,spacingMm,lineHMm);
        } else if(fontMode==='ttf'&&ttfFace){
          await ttfFace.load();
          document.fonts.add(ttfFace);
          s=await systemFontToStrokes(text,ttfFace.family,fontSizeMm,spacingMm,lineHMm);
        }
        if(!cancelled)setStrokes(s);
      } catch(e){console.error(e);}
      if(!cancelled)setLoading(false);
    };
    run();
    return()=>{cancelled=true;};
  },[text,fontMode,hersheyKey,systemFont,ttfFace,fontSizeMm,spacingMm,lineHMm]);

  // Draw preview
  useEffect(()=>{
    const cv=canvasRef.current;if(!cv)return;
    drawCanvas(cv,strokes);
    if(resizeObs.current)resizeObs.current.disconnect();
    resizeObs.current=new ResizeObserver(()=>drawCanvas(cv,strokes));
    resizeObs.current.observe(cv);
    return()=>resizeObs.current?.disconnect();
  },[strokes]);

  const loadTTF=file=>{
    const ext=file.name.split('.').pop().toLowerCase();
    if(!['ttf','otf','woff','woff2'].includes(ext)){setErr('נתמך: TTF, OTF, WOFF, WOFF2');return;}
    const url=URL.createObjectURL(file);
    const name=file.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9]/g,'-');
    setTtfFace(new FontFace(name,`url(${url})`));
    setTtfName(file.name);setFontMode('ttf');setErr('');
  };

  const importFile=file=>{
    const ext=file.name.split('.').pop().toLowerCase();
    const reader=new FileReader();
    reader.onload=e=>{
      const c=e.target.result;
      if(ext==='txt'){setText(c.trim());return;}
      if(ext==='svg'){
        const doc=new DOMParser().parseFromString(c,'image/svg+xml');
        const t=[...doc.querySelectorAll('text,tspan')].map(el=>el.textContent.trim()).filter(Boolean).join('\n');
        t?setText(t):setErr('לא נמצא טקסט ב-SVG');
      } else if(ext==='dxf'){
        const ls=c.split('\n').map(l=>l.trim());const ts=[];
        for(let i=0;i<ls.length-1;i++)if(ls[i]==='TEXT'||ls[i]==='MTEXT')for(let j=i;j<Math.min(i+30,ls.length-1);j++)if(parseInt(ls[j])===1){ts.push(ls[j+1]);break;}
        ts.length?setText(ts.join('\n')):setErr('לא נמצא טקסט ב-DXF');
      } else setErr(`לא נתמך: .${ext}`);
    };
    reader.readAsText(file);
  };

  const dl=(content,name,type)=>{const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);};

  const card={background:'#fff',border:'1px solid #e0e4ea',borderRadius:10,padding:'14px 16px',marginBottom:12,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'};
  const row={display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8};
  const lbl={fontSize:13,color:'#4a5568'};
  const inp=(c='#2563eb')=>({width:75,background:'#f8faff',border:'1px solid #c7d2fe',borderRadius:6,padding:'5px 8px',color:c,fontSize:13,textAlign:'center',fontFamily:'inherit'});
  const tabBtn=(active)=>({padding:'8px 14px',borderRadius:7,fontSize:13,cursor:'pointer',border:'none',background:active?'#ede9fe':'#f1f5f9',color:active?'#7c3aed':'#64748b',fontFamily:'inherit',fontWeight:active?600:400,transition:'all 0.15s'});

  return(
    <div dir="rtl" style={{minHeight:'100vh',background:'#f1f5f9',fontFamily:"'Segoe UI',Arial,sans-serif",fontSize:'15px',color:'#1e293b'}}>

      {/* Header */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'16px 28px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <div style={{width:38,height:38,borderRadius:8,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff',fontWeight:700}}>T</div>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:'#1e293b'}}>TEXT → G-CODE</div>
          <div style={{fontSize:12,color:'#94a3b8',marginTop:1}}>Single-Line Fonts + פונטי מערכת + TTF/OTF</div>
        </div>
      </div>

      <div style={{padding:'18px 24px',maxWidth:1300,margin:'0 auto',display:'grid',gridTemplateColumns:'310px 1fr',gap:18,alignItems:'start'}}>

        {/* LEFT */}
        <div>

          {/* Font mode selector */}
          <div style={card}>
            <div style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:10}}>🔤 סוג פונט</div>
            <div style={{display:'flex',gap:6,marginBottom:12}}>
              {[['hershey','CNC Fonts'],['system','מערכת'],['ttf','TTF/OTF']].map(([m,l])=>(
                <button key={m} onClick={()=>setFontMode(m)} style={tabBtn(fontMode===m)}>{l}</button>
              ))}
            </div>

            {fontMode==='hershey'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {Object.entries(FONTS).map(([k,{name}])=>(
                  <button key={k} onClick={()=>setHersheyKey(k)}
                    style={{...tabBtn(hersheyKey===k),padding:'9px 6px',fontSize:13}}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            {fontMode==='system'&&(
              systemFonts.length>0?(
                <div>
                  <div style={{fontSize:12,color:'#94a3b8',marginBottom:6}}>נמצאו {systemFonts.length} פונטים</div>
                  <select value={systemFont} onChange={e=>setSystemFont(e.target.value)}
                    style={{width:'100%',background:'#f8faff',border:'1px solid #c7d2fe',borderRadius:7,padding:'8px 10px',fontSize:14,color:'#1e293b',fontFamily:'inherit'}}>
                    {systemFonts.map(f=><option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}
                  </select>
                  {systemFont&&<div style={{marginTop:8,padding:'8px',background:'#f8faff',borderRadius:6,fontSize:20,textAlign:'center',fontFamily:systemFont,color:'#1e293b'}}>Aa בב 123</div>}
                </div>
              ):(
                <div style={{fontSize:13,color:'#94a3b8',textAlign:'center',padding:'10px'}}>⚙ סורק פונטים...</div>
              )
            )}

            {fontMode==='ttf'&&(
              <div>
                <button onClick={()=>ttfRef.current?.click()}
                  style={{width:'100%',padding:'10px',borderRadius:7,fontSize:13,cursor:'pointer',background:ttfFace?'#ede9fe':'#f8faff',border:`1px solid ${ttfFace?'#7c3aed':'#c7d2fe'}`,color:ttfFace?'#7c3aed':'#64748b',fontFamily:'inherit',marginBottom:6}}>
                  📁 {ttfName||'בחר קובץ פונט...'}
                </button>
                <input ref={ttfRef} type="file" accept=".ttf,.otf,.woff,.woff2" onChange={e=>{if(e.target.files[0])loadTTF(e.target.files[0])}} style={{display:'none'}}/>
                <div style={{fontSize:11,color:'#94a3b8'}}>TTF, OTF, WOFF, WOFF2 — מומר לקו מרכזי</div>
              </div>
            )}
          </div>

          {/* Import */}
          <div style={card}>
            <div style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:8}}>📂 ייבוא טקסט</div>
            <button onClick={()=>importRef.current?.click()}
              style={{width:'100%',padding:'9px',borderRadius:7,fontSize:13,cursor:'pointer',background:'#f8faff',border:'1px solid #c7d2fe',color:'#4f46e5',fontFamily:'inherit'}}>
              📂 SVG / DXF / TXT
            </button>
            <input ref={importRef} type="file" accept=".svg,.dxf,.txt" onChange={e=>{if(e.target.files[0])importFile(e.target.files[0])}} style={{display:'none'}}/>
            {err&&<div style={{marginTop:6,fontSize:11,color:'#ef4444'}}>⚠ {err}</div>}
          </div>

          {/* Text */}
          <div style={card}>
            <div style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:8}}>✏ טקסט</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} dir="auto"
              style={{width:'100%',background:'#fff',border:'1px solid #e2e8f0',borderRadius:7,padding:'8px',color:'#1e293b',fontSize:14,fontFamily:'inherit',resize:'vertical',boxSizing:'border-box',lineHeight:1.7}}
              placeholder="הכנס טקסט...&#10;Enter text..."/>
          </div>

          {/* Typography */}
          <div style={card}>
            <div style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:8}}>📐 טיפוגרפיה</div>
            {[
              {l:'גודל (mm)',v:fontSizeMm,s:setFontSizeMm,min:1,max:200,step:0.5},
              {l:'רווח אותיות (mm)',v:spacingMm,s:setSpacingMm,min:0,max:30,step:0.5},
              {l:'גובה שורה (mm)',v:lineHMm,s:setLineHMm,min:5,max:300,step:1},
            ].map(({l,v,s,min,max,step})=>(
              <div key={l} style={row}>
                <span style={lbl}>{l}:</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <input type="range" min={min} max={max} step={step} value={v} onChange={e=>s(+e.target.value)} style={{width:70}}/>
                  <input type="number" min={min} max={999} step={step} value={v} onChange={e=>s(+e.target.value)} style={inp()}/>
                </div>
              </div>
            ))}
          </div>

          {/* Cut */}
          <div style={card}>
            <div style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:8}}>✂ חיתוך</div>
            {[
              {l:'מהירות (mm/min)',v:feedRate,s:setFeedRate,c:'#2563eb'},{l:'ירידה (mm/min)',v:plungeRate,s:setPlungeRate,c:'#d97706'},
              {l:'Z בטוח (mm)',v:zSafe,s:setZSafe,c:'#2563eb'},{l:'עומק (mm)',v:zCut,s:setZCut,c:'#dc2626'},
              {l:'X מקור',v:ox,s:setOx,c:'#2563eb'},{l:'Y מקור',v:oy,s:setOy,c:'#2563eb'},
            ].map(({l,v,s,c})=>(
              <div key={l} style={row}><span style={lbl}>{l}:</span><input type="number" value={v} step={0.1} onChange={e=>s(+e.target.value)} style={inp(c)}/></div>
            ))}
          </div>

          {/* Stats */}
          <div style={{...card,background:'#f0fdf4',border:'1px solid #bbf7d0'}}>
            <div style={{display:'flex',gap:16}}>
              <div><div style={{fontSize:11,color:'#6b7280'}}>קווים</div><div style={{fontSize:20,fontWeight:700,color:'#059669'}}>{loading?'..':strokes.length}</div></div>
              <div><div style={{fontSize:11,color:'#6b7280'}}>אותיות</div><div style={{fontSize:20,fontWeight:700,color:'#374151'}}>{Array.from(text.replace(/\n/g,'')).length}</div></div>
              <div><div style={{fontSize:11,color:'#6b7280'}}>פונט</div><div style={{fontSize:13,fontWeight:600,color:'#7c3aed'}}>{fontMode==='hershey'?FONTS[hersheyKey]?.name:fontMode==='system'?systemFont:ttfName.split('.')[0]}</div></div>
            </div>
          </div>

          {/* Export */}
          <input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="שם קובץ"
            style={{width:'100%',background:'#fff',border:'1px solid #e2e8f0',borderRadius:7,padding:'8px 10px',color:'#1e293b',fontSize:13,boxSizing:'border-box',fontFamily:'inherit',marginBottom:8}}/>
          <button onClick={()=>dl(toGcode(strokes,{feedRate,plungeRate,zSafe,zCut,ox,oy}),`${fileName}.gcode`,'text/plain')}
            disabled={!strokes.length||loading}
            style={{width:'100%',padding:'12px',borderRadius:8,fontSize:14,cursor:'pointer',background:'linear-gradient(135deg,#7c3aed,#4f46e5)',border:'none',color:'#fff',fontFamily:'inherit',fontWeight:600,marginBottom:8,opacity:strokes.length?1:0.5}}>
            ⬇ {fileName}.gcode
          </button>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>dl(toSVG(strokes,svgColor),`${fileName}.svg`,'image/svg+xml')}
              disabled={!strokes.length}
              style={{flex:1,padding:'9px',borderRadius:8,fontSize:13,cursor:'pointer',background:'#fff',border:'1px solid #c7d2fe',color:'#4f46e5',fontFamily:'inherit'}}>
              ⬇ {fileName}.svg
            </button>
            <input type="color" value={svgColor} onChange={e=>setSvgColor(e.target.value)}
              style={{width:38,height:38,borderRadius:6,border:'1px solid #e2e8f0',cursor:'pointer',padding:2}}/>
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
            <div style={{padding:'10px 16px',borderBottom:'1px solid #f1f5f9',fontSize:12,color:'#64748b',display:'flex',gap:12,alignItems:'center',background:'#f8fafc'}}>
              <span style={{fontWeight:600,color:'#1e293b'}}>תצוגה מקדימה</span>
              <span style={{color:'#7c3aed'}}>{fontMode==='hershey'?FONTS[hersheyKey]?.name:fontMode==='system'?systemFont:ttfName}</span>
              {loading&&<span style={{color:'#f59e0b'}}>⚙ מעבד...</span>}
              <span style={{color:'#cbd5e1',marginRight:'auto'}}>כחול כהה = חיתוך | אדום = אוויר</span>
            </div>
            <canvas ref={canvasRef} style={{width:'100%',height:'460px',display:'block'}}/>
          </div>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#64748b',lineHeight:1.8}}>
            <span style={{fontWeight:600,color:'#374151'}}>CNC Fonts: </span>Sans · Italic · Bold · Gothic
            <span style={{fontWeight:600,color:'#374151',marginRight:8}}> | מערכת: </span>פונטי Windows/Mac
            <span style={{fontWeight:600,color:'#374151',marginRight:8}}> | TTF/OTF: </span>כל פונט מהמחשב
          </div>
        </div>
      </div>
    </div>
  );
}
