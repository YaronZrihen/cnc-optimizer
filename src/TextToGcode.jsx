import { useState, useRef, useEffect } from "react";

// ============================================================
// HERSHEY FONT DATA
// [advanceWidth, [[x1,y1,x2,y2], ...strokes]]
// Cap height = 21 units
// ============================================================
const S = pts => pts.reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[]);

const HERSHEY_SANS = {
  ' ':[8,[]],'!':[4,[[2,21,2,7],[2,2,3,2],[3,2,3,1],[3,1,2,1],[2,1,2,2]]],
  '"':[8,[[1,21,1,16],[6,21,6,16]]],"'":[4,[[1,21,1,16]]],
  '(':[6,S([[4,25],[2,22],[1,18],[0,14],[0,8],[1,4],[2,0],[4,-3]])],')':[6,S([[0,25],[2,22],[3,18],[4,14],[4,8],[3,4],[2,0],[0,-3]])],
  '*':[10,[[5,21,5,9],[1,18,9,12],[9,18,1,12]]],'+':[12,[[6,21,6,0],[1,10,11,10]]],
  ',':[4,S([[2,2],[2,1],[3,1],[3,2],[2,2],[1,0]])],'.':[4,S([[1,1],[1,0],[2,0],[2,1],[1,1]])],'/':[10,[[0,0,10,21]]],
  '-':[10,[[1,10,9,10]]],'_':[10,[[0,-2,10,-2]]],'\\':[10,[[0,21,10,0]]],
  '0':[12,S([[5,21],[3,20],[1,18],[0,16],[0,5],[1,3],[3,1],[5,0],[7,0],[9,1],[11,3],[12,5],[12,16],[11,18],[9,20],[7,21],[5,21],[3,15,9,6]])],'1':[8,[[2,17,5,21],[5,21,5,0]]],
  '2':[12,S([[1,16],[2,14],[4,12],[7,10],[9,8],[10,5],[10,3],[9,1],[7,0],[5,0],[3,1],[1,3]])],'3':[12,S([[1,20],[3,21],[5,21],[9,19],[10,17],[10,14],[8,11],[5,10],[8,9],[10,6],[10,3],[8,1],[6,0],[4,0],[2,1],[1,2]])],
  '4':[12,[[8,21,8,0],[0,14,12,14],[0,14,8,21]]],'5':[12,S([[11,20],[9,21],[4,21],[2,19],[1,17],[1,14],[2,12],[4,11],[6,11],[9,12],[11,14],[12,17],[12,19],[11,21],[9,21]])],
  '6':[12,S([[9,19],[7,21],[5,21],[3,20],[1,17],[0,13],[0,8],[1,4],[3,1],[6,0],[8,0],[11,1],[13,4],[13,6],[12,9],[10,11],[7,11],[4,10],[1,7]])],'7':[12,[[0,21,12,21],[12,21,3,0]]],
  '8':[12,S([[5,0],[3,1],[1,4],[1,6],[2,9],[4,11],[7,11],[10,9],[11,6],[11,4],[9,1],[7,0],[5,0]])],'9':[12,S([[11,14],[9,12],[7,11],[5,11],[2,12],[0,14],[0,16],[1,19],[3,21],[6,21],[9,20],[11,17],[12,13],[12,8],[11,4],[9,1],[7,0],[4,0],[2,1]])],
  ':':[4,S([[1,12],[1,11],[2,11],[2,12],[1,12],[1,2],[1,1],[2,1],[2,2],[1,2]])],'=':[12,[[1,13,11,13],[1,7,11,7]]],
  '?':[10,S([[1,16],[2,14],[4,12],[7,10],[9,8],[10,5],[10,3],[9,1],[7,0],[5,0],[3,1],[2,2],[9,21],[11,19],[11,16],[9,14],[7,13]])],'@':[16,S([[11,13],[10,15],[8,17],[6,18],[4,18],[2,17],[0,15],[0,9],[1,7],[3,5],[5,4],[7,4],[9,5],[11,7],[12,9],[12,13],[12,17],[11,19],[9,20],[7,20],[5,19],[3,17]])],
  'A':[14,[[0,0,7,21],[14,0,7,21],[3,7,11,7]]],'B':[14,[[0,0,0,21],[0,21,9,21],[12,20,13,18],[13,18,13,14],[13,14,12,12],[12,12,9,11],[9,11,0,11],[0,11,10,11],[13,9,14,6],[14,6,14,3],[14,3,12,1],[12,1,9,0],[9,0,0,0]]],
  'C':[13,S([[13,4],[11,2],[9,1],[6,1],[4,2],[2,4],[1,6],[0,9],[0,13],[1,16],[2,18],[4,20],[6,21],[9,21],[11,20],[13,18]])],'D':[14,S([[0,0,0,21],[0,21,7,21],[10,20],[12,18],[13,16],[14,13],[14,8],[13,5],[12,3],[10,1],[7,0],[0,0]])],
  'E':[12,[[0,0,0,21],[0,21,11,21],[0,11,7,11],[0,0,11,0]]],'F':[11,[[0,0,0,21],[0,21,11,21],[0,11,7,11]]],
  'G':[14,S([[13,18],[11,20],[9,21],[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[9,0],[11,1],[13,3],[13,8],[8,8]])],'H':[14,[[0,0,0,21],[14,0,14,21],[0,11,14,11]]],
  'I':[4,[[0,0,4,0],[2,0,2,21],[0,21,4,21]]],'J':[11,S([[0,2],[1,0],[3,0],[5,1],[6,3],[6,21]])],'K':[13,[[0,0,0,21],[13,21,0,8],[5,13,13,0]]],'L':[12,[[0,21,0,0],[0,0,12,0]]],
  'M':[16,[[0,0,0,21],[0,21,8,7],[8,7,16,21],[16,21,16,0]]],'N':[14,[[0,0,0,21],[0,21,14,0],[14,0,14,21]]],
  'O':[14,S([[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[8,0],[10,1],[12,3],[13,5],[14,8],[14,13],[13,16],[12,18],[10,20],[8,21],[6,21]])],'P':[13,S([[0,0,0,21],[0,21,9,21],[12,20],[13,18],[13,14],[12,12],[9,11],[0,11]])],
  'Q':[14,[[6,21,4,20],[4,20,2,18],[2,18,1,16],[1,16,0,13],[0,13,0,8],[0,8,1,5],[1,5,2,3],[2,3,4,1],[4,1,6,0],[6,0,8,0],[8,0,10,1],[10,1,12,3],[12,3,13,5],[13,5,14,8],[14,8,14,13],[14,13,13,16],[13,16,12,18],[12,18,10,20],[10,20,8,21],[8,21,6,21],[10,6,14,0]]],
  'R':[13,[[0,0,0,21],[0,21,9,21],[12,20,13,18],[13,18,13,14],[13,14,12,12],[12,12,9,11],[9,11,0,11],[6,11,13,0]]],'S':[12,S([[12,18],[10,20],[8,21],[5,21],[3,20],[1,18],[1,16],[2,14],[4,12],[9,10],[11,8],[12,6],[12,3],[10,1],[8,0],[5,0],[3,1],[1,3]])],
  'T':[12,[[6,0,6,21],[0,21,12,21]]],'U':[14,S([[0,21,0,5],[0,3,1,1],[1,1,3,0],[5,0,9,0],[11,1,13,3],[13,3,14,5],[14,5,14,21]])],'V':[14,[[0,21,7,0],[14,21,7,0]]],'W':[18,[[0,21,4,0],[9,21,4,0],[9,21,14,0],[18,21,14,0]]],'X':[14,[[0,21,14,0],[14,21,0,0]]],
  'Y':[14,[[0,21,7,11],[7,11,7,0],[14,21,7,11]]],'Z':[14,[[0,21,14,21],[14,21,0,0],[0,0,14,0]]],
  'a':[12,S([[9,14,9,0],[9,11,7,13],[5,14],[3,14],[1,13],[0,11],[0,9],[1,7],[3,6],[5,6],[7,7],[9,9]])],'b':[12,S([[0,21,0,0],[0,11,2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]])],'c':[11,S([[11,11],[9,13],[7,14],[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5]])],
  'd':[12,S([[12,21,12,0],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],'e':[11,S([[0,9,11,9],[11,9,11,11],[10,13,8,14],[6,14],[4,13],[2,11],[1,9],[0,7],[0,5],[1,3],[3,2],[5,2],[7,3],[9,5]])],'f':[7,S([[5,21],[3,21],[2,20],[1,18],[1,0],[3,14,7,14]])],
  'g':[12,S([[12,14,12,-4],[12,-4,10,-6],[8,-7],[6,-7],[4,-6],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],'h':[12,S([[0,21,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0]])],'i':[4,[[1,21,1,20],[1,20,2,20],[2,20,2,21],[2,21,1,21],[1,14,1,0]]],
  'j':[5,[[2,21,2,20],[2,20,3,20],[3,20,3,21],[3,21,2,21],[3,14,3,-2],[3,-2,2,-4],[2,-4,0,-5]]],'k':[11,[[0,21,0,0],[0,6,9,14],[4,8,11,0]]],'l':[4,[[0,21,0,0]]],
  'm':[18,S([[0,14,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0],[10,10,12,13],[14,14],[17,14],[19,13],[20,10],[20,0]])],'n':[12,S([[0,14,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0]])],'o':[12,S([[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5],[12,7],[12,9],[11,11],[9,13],[7,14],[5,14]])],
  'p':[12,S([[0,14,0,-7],[0,11,2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]])],'q':[12,S([[12,14,12,-7],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],'r':[7,[[0,14,0,0],[0,8,1,11],[1,11,3,13],[3,13,5,14],[5,14,7,14]]],
  's':[10,S([[9,11],[7,13],[5,14],[3,14],[1,13],[0,11],[0,9],[1,8],[4,7],[6,6],[8,5],[9,3],[9,2],[8,0],[6,-1],[4,-1],[2,0],[0,2]])],'t':[7,[[2,21,2,3],[2,3,3,1],[3,1,5,0],[5,0,7,0],[0,14,6,14]]],'u':[12,S([[0,14,0,4],[0,2,1,0],[1,0,3,0],[5,0,7,1],[9,4,10,14],[10,0,10,14]])],
  'v':[12,[[0,14,6,0],[12,14,6,0]]],'w':[16,[[0,14,4,0],[8,14,4,0],[8,14,12,0],[16,14,12,0]]],'x':[12,[[0,14,12,0],[12,14,0,0]]],'y':[12,[[0,14,6,0],[12,14,6,0],[6,0,5,-2],[5,-2,3,-4],[3,-4,1,-4],[1,-4,0,-3]]],'z':[11,[[0,14,11,14],[11,14,0,0],[0,0,11,0]]],
  // Hebrew — designed with natural RTL orientation (open side faces LEFT for correct CNC output)
  'א':[14,[[13,0,7,14],[7,14,1,0],[7,14,7,7]]],'ב':[13,[[1,14,11,14],[11,14,13,12],[13,12,13,1],[13,1,1,1],[13,7,6,7]]],'ג':[11,[[2,14,10,14],[10,14,11,12],[11,12,11,0]]],'ד':[13,[[13,0,13,12],[13,12,11,14],[11,14,1,14],[1,14,1,0]]],
  'ה':[13,[[13,0,13,14],[13,14,1,14],[1,14,1,5],[7,14,7,0]]],'ו':[5,[[2,14,2,0]]],'ז':[9,[[9,14,1,14],[1,14,4,0]]],'ח':[13,[[13,0,13,14],[1,0,1,14],[13,14,1,14]]],
  'ט':[13,[[13,0,13,14],[13,14,1,14],[1,14,1,0],[6,14,6,5]]],'י':[6,[[1,14,3,12],[3,12,3,0]]],'כ':[12,[[1,14,11,14],[11,14,12,12],[12,12,12,1],[12,1,1,1]]],'ך':[12,[[1,14,11,14],[11,14,12,12],[12,12,12,-5]]],
  'ל':[11,[[2,14,10,14],[10,14,11,12],[11,12,11,6],[11,6,9,4],[9,4,2,4],[2,4,2,0]]],'מ':[13,[[13,0,13,14],[1,0,1,10],[1,10,7,14],[7,14,13,14],[7,14,7,0]]],'ם':[13,[[13,0,13,14],[1,0,1,14],[13,14,1,14],[13,0,8,0]]],
  'נ':[11,[[2,14,10,14],[10,14,11,12],[11,12,11,0],[11,14,2,0]]],'ן':[5,[[2,14,2,-4]]],'ס':[13,S([[7,14],[9,14],[11,13],[13,11],[13,5],[11,3],[9,2],[7,2],[5,2],[3,3],[1,5],[1,9],[3,11],[5,13],[7,14],[7,7,13,7]])],'ע':[13,[[13,14,9,7],[9,7,7,0],[7,0,4,7],[4,7,1,14],[9,7,4,7]]],
  'פ':[12,[[1,14,10,14],[10,14,12,12],[12,12,12,8],[12,8,10,6],[10,6,5,6],[5,6,5,0],[13,0,5,0]]],'ף':[12,[[1,14,10,14],[10,14,12,12],[12,12,12,8],[12,8,10,6],[10,6,5,6],[5,6,5,-5]]],'צ':[13,[[13,0,9,14],[9,14,5,0],[5,0,1,14],[9,14,1,14]]],'ץ':[13,[[13,0,9,14],[9,14,5,0],[5,0,1,14],[9,14,1,14],[5,0,5,-5]]],
  'ק':[12,[[12,0,12,14],[12,14,1,14],[1,14,1,5]]],'ר':[11,[[11,0,11,12],[11,12,9,14],[9,14,1,14]]],'ש':[14,[[14,0,14,14],[14,14,7,14],[7,14,7,0],[7,14,1,0]]],'ת':[14,[[14,0,14,14],[14,14,1,14],[1,14,1,5],[7,14,7,0]]],
};

// Italic: shear transform
const makeItalic = font => Object.fromEntries(Object.entries(font).map(([ch,[w,segs]])=>
  [ch,[w,segs.map(([x1,y1,x2,y2])=>[x1+y1*0.25,y1,x2+y2*0.25,y2])]]
]));

// Bold: duplicate offset strokes
const makeBold = (font,d=0.7) => Object.fromEntries(Object.entries(font).map(([ch,[w,segs]])=>
  [ch,[w+d,[...segs,...segs.map(([x1,y1,x2,y2])=>[x1+d,y1,x2+d,y2])]]]
]));

// Gothic: extend serifs
const makeGothic = font => {
  const g = {...font};
  g['A']=[14,[[0,0,7,21],[14,0,7,21],[2,6,12,6],[0,0,2,0],[14,0,12,0],[5,21,9,21]]];
  g['E']=[12,[[0,0,0,21],[0,21,12,21],[0,11,9,11],[0,0,12,0],[0,0,0,2],[0,19,0,21]]];
  g['H']=[14,[[0,0,0,21],[14,0,14,21],[0,10,14,10],[0,0,2,0],[12,0,14,0],[0,21,2,21],[12,21,14,21]]];
  g['I']=[6,[[0,0,6,0],[3,0,3,21],[0,21,6,21]]];
  g['L']=[12,[[0,21,0,0],[0,0,12,0],[0,0,0,2]]];
  g['T']=[12,[[6,0,6,21],[0,21,12,21],[4,0,8,0]]];
  return g;
};

const FONTS = {
  sans:   { label:'Sans',   data: HERSHEY_SANS },
  italic: { label:'Italic', data: makeItalic(HERSHEY_SANS) },
  bold:   { label:'Bold',   data: makeBold(HERSHEY_SANS) },
  gothic: { label:'Gothic', data: makeGothic(HERSHEY_SANS) },
};

// ============================================================
// SYSTEM FONTS — query available fonts via canvas
// ============================================================
const SYSTEM_FONT_LIST = [
  'Arial','Arial Black','Arial Narrow','Calibri','Cambria','Century Gothic',
  'Comic Sans MS','Consolas','Courier New','David','FrankRuehl','Futura',
  'Georgia','Gill Sans','Helvetica','Impact','Lucida Console','Lucida Sans',
  'Microsoft Sans Serif','MV Boli','Narkisim','Palatino','Segoe UI',
  'Tahoma','Times New Roman','Trebuchet MS','Verdana',
];

function detectSystemFonts() {
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 50;
  const ctx = canvas.getContext('2d');
  const base = 'monospace';
  ctx.font = `16px ${base}`;
  const ref = ctx.measureText('abcdefghijklmnopqrstuvwxyz0123456789').width;
  return SYSTEM_FONT_LIST.filter(f => {
    ctx.font = `16px "${f}", ${base}`;
    return ctx.measureText('abcdefghijklmnopqrstuvwxyz0123456789').width !== ref;
  });
}

// ============================================================
// SYSTEM FONT → STROKES via canvas skeleton
// ============================================================
function systemFontToStrokes(fontFamily, text, sizeMm, spacingMm, lineHeightMm) {
  const PX = 60;
  const canvas = document.createElement('canvas');
  canvas.width = 2; canvas.height = 2;
  const ctx = canvas.getContext('2d');
  const scale = sizeMm / PX;
  const lines = text.split('\n');
  const allStrokes = [];

  lines.forEach((line, li) => {
    const chars = Array.from(line);
    let xOff = 0;
    chars.forEach(ch => {
      if (ch === '\n') return;
      ctx.font = `${PX}px "${fontFamily}"`;
      const cw = Math.max(4, Math.ceil(ctx.measureText(ch).width)) + 4;
      canvas.width = cw; canvas.height = PX + 10;
      ctx.clearRect(0, 0, cw, canvas.height);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, canvas.height);
      ctx.fillStyle = '#000';
      ctx.font = `${PX}px "${fontFamily}"`;
      ctx.fillText(ch, 2, PX - 4);
      const d = ctx.getImageData(0, 0, cw, canvas.height).data;
      const W = cw, H = canvas.height;
      const bin = new Uint8Array(W * H);
      for (let i = 0; i < W*H; i++) bin[i] = d[i*4] < 128 ? 1 : 0;
      // Column midpoint skeleton
      for (let x = 0; x < W-1; x++) {
        const c1=[], c2=[];
        for (let y=0;y<H;y++){if(bin[y*W+x])c1.push(y);}
        for (let y=0;y<H;y++){if(bin[y*W+x+1])c2.push(y);}
        if (!c1.length||!c2.length) continue;
        const m1=c1.reduce((a,b)=>a+b,0)/c1.length;
        const m2=c2.reduce((a,b)=>a+b,0)/c2.length;
        allStrokes.push({
          x1: xOff + x*scale,
          y1: li*lineHeightMm + (PX-m1)*scale,
          x2: xOff + (x+1)*scale,
          y2: li*lineHeightMm + (PX-m2)*scale,
        });
      }
      xOff += cw * scale + spacingMm;
    });
  });
  return allStrokes;
}

// ============================================================
// HERSHEY TEXT → STROKES (with correct Hebrew RTL)
// ============================================================
const IS_HEB = /[\u05D0-\u05EA]/;

function hersheyToStrokes(text, fontData, sizeMm, spacingMm, lineHeightMm) {
  const FH = 21; // font cap height units
  const sc = sizeMm / FH;
  const allStrokes = [];

  text.split('\n').forEach((line, li) => {
    const rtl = IS_HEB.test(line);
    // For RTL, reverse char order so we lay out right-to-left
    const chars = rtl ? Array.from(line).reverse() : Array.from(line);
    let xOff = 0;
    chars.forEach(ch => {
      const [w, segs] = fontData[ch] || fontData[' '];
      segs.forEach(([x1,y1,x2,y2]) => {
        // Hebrew glyphs are pre-mirrored in font data — no additional flip needed
        allStrokes.push({
          x1: xOff + x1*sc,
          y1: li*lineHeightMm + y1*sc,
          x2: xOff + x2*sc,
          y2: li*lineHeightMm + y2*sc,
        });
      });
      xOff += w*sc + spacingMm;
    });
  });
  return allStrokes;
}

// ============================================================
// EXPORT
// ============================================================
function toGcode(strokes, p) {
  const {feedRate,plungeRate,zSafe,zCut,ox,oy} = p;
  let g = `; Text G-code\nG21\nG90\nG0 Z${zSafe}\n`;
  let px=null,py=null;
  for (const s of strokes) {
    const x1=+(s.x1+ox).toFixed(3),y1=+(s.y1+oy).toFixed(3),x2=+(s.x2+ox).toFixed(3),y2=+(s.y2+oy).toFixed(3);
    if (px===null||Math.hypot(px-x1,py-y1)>0.05) g+=`G0 Z${zSafe}\nG0 X${x1} Y${y1}\nG1 Z${zCut} F${plungeRate}\n`;
    g+=`G1 X${x2} Y${y2} F${feedRate}\n`;
    px=x2;py=y2;
  }
  return g+`G0 Z${zSafe}\nM2\n`;
}

function toSVG(strokes, color) {
  if (!strokes.length) return '';
  let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
  strokes.forEach(s=>{mnX=Math.min(mnX,s.x1,s.x2);mnY=Math.min(mnY,s.y1,s.y2);mxX=Math.max(mxX,s.x1,s.x2);mxY=Math.max(mxY,s.y1,s.y2);});
  const p=5,W=mxX-mnX+p*2,H=mxY-mnY+p*2;
  const ls=strokes.map(s=>`<line x1="${(s.x1-mnX+p).toFixed(2)}" y1="${(H-(s.y1-mnY+p)).toFixed(2)}" x2="${(s.x2-mnX+p).toFixed(2)}" y2="${(H-(s.y2-mnY+p)).toFixed(2)}" stroke="${color}" stroke-width="0.5" stroke-linecap="round"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}mm" height="${H.toFixed(1)}mm" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">\n${ls}\n</svg>`;
}

// ============================================================
// CANVAS PREVIEW
// ============================================================
function drawCanvas(canvas, strokes) {
  if (!canvas) return;
  const W=canvas.clientWidth,H=canvas.clientHeight;
  if (!W||!H) return;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
  if (!strokes.length) {
    ctx.fillStyle='#aaa'; ctx.font='14px sans-serif'; ctx.textAlign='center';
    ctx.fillText('הכנס טקסט לתצוגה',W/2,H/2); return;
  }
  let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
  strokes.forEach(s=>{mnX=Math.min(mnX,s.x1,s.x2);mnY=Math.min(mnY,s.y1,s.y2);mxX=Math.max(mxX,s.x1,s.x2);mxY=Math.max(mxY,s.y1,s.y2);});
  const pad=30,bw=mxX-mnX||1,bh=mxY-mnY||1;
  const sc=Math.min((W-pad*2)/bw,(H-pad*2)/bh);
  const ox2=pad+(W-pad*2-bw*sc)/2,oy2=pad+(H-pad*2-bh*sc)/2;
  const tx=x=>ox2+(x-mnX)*sc,ty=y=>H-oy2-(y-mnY)*sc;
  let prev=null;
  for (const s of strokes) {
    if (prev&&Math.hypot(prev.x2-s.x1,prev.y2-s.y1)>0.05) {
      ctx.strokeStyle='rgba(220,60,60,0.3)';ctx.lineWidth=0.8;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(tx(prev.x2),ty(prev.y2));ctx.lineTo(tx(s.x1),ty(s.y1));ctx.stroke();ctx.setLineDash([]);
    }
    ctx.strokeStyle='#222';ctx.lineWidth=1.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(tx(s.x1),ty(s.y1));ctx.lineTo(tx(s.x2),ty(s.y2));ctx.stroke();
    prev=s;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TextToGcode() {
  const [text, setText] = useState('Hello CNC\nשלום עולם');
  const [fontMode, setFontMode] = useState('hershey'); // 'hershey' | 'system' | 'ttf'
  const [hersheyKey, setHersheyKey] = useState('sans');
  const [systemFonts, setSystemFonts] = useState([]);
  const [systemFont, setSystemFont] = useState('Arial');
  const [ttfFace, setTtfFace] = useState(null);
  const [ttfName, setTtfName] = useState('');
  const [sizeMm, setSizeMm] = useState(10);
  const [spacingMm, setSpacingMm] = useState(1);
  const [lineHMm, setLineHMm] = useState(20);
  const [feedRate, setFeedRate] = useState(800);
  const [plungeRate, setPlungeRate] = useState(200);
  const [zSafe, setZSafe] = useState(5);
  const [zCut, setZCut] = useState(-0.3);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [svgColor, setSvgColor] = useState('#000000');
  const [fileName, setFileName] = useState('text');
  const [strokes, setStrokes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const canvasRef = useRef(null);
  const ttfRef = useRef(null);
  const importRef = useRef(null);
  const obsRef = useRef(null);

  // Detect system fonts once
  useEffect(() => { setSystemFonts(detectSystemFonts()); }, []);

  // Recompute strokes
  useEffect(() => {
    if (fontMode === 'hershey') {
      setStrokes(hersheyToStrokes(text, FONTS[hersheyKey].data, sizeMm, spacingMm, lineHMm));
    } else if (fontMode === 'system') {
      setLoading(true);
      setTimeout(() => {
        setStrokes(systemFontToStrokes(systemFont, text, sizeMm, spacingMm, lineHMm));
        setLoading(false);
      }, 10);
    } else if (fontMode === 'ttf' && ttfFace) {
      setLoading(true);
      ttfFace.load().then(() => {
        document.fonts.add(ttfFace);
        setStrokes(systemFontToStrokes(ttfFace.family, text, sizeMm, spacingMm, lineHMm));
        setLoading(false);
      });
    }
  }, [text, fontMode, hersheyKey, systemFont, ttfFace, sizeMm, spacingMm, lineHMm]);

  // Draw preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, strokes);
    if (obsRef.current) obsRef.current.disconnect();
    obsRef.current = new ResizeObserver(() => drawCanvas(canvas, strokes));
    obsRef.current.observe(canvas);
    return () => obsRef.current?.disconnect();
  }, [strokes]);

  const loadTTF = file => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['ttf','otf','woff','woff2'].includes(ext)) { setErr('נתמך: TTF, OTF, WOFF'); return; }
    const url = URL.createObjectURL(file);
    const name = 'custom-' + Date.now();
    const face = new FontFace(name, `url(${url})`);
    setTtfFace(face); setTtfName(file.name); setFontMode('ttf'); setErr('');
  };

  const importFile = file => {
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = e => {
      const c = e.target.result;
      if (ext === 'txt') { setText(c.trim()); return; }
      if (ext === 'svg') {
        const doc = new DOMParser().parseFromString(c, 'image/svg+xml');
        const t = [...doc.querySelectorAll('text,tspan')].map(el=>el.textContent.trim()).filter(Boolean).join('\n');
        t ? setText(t) : setErr('לא נמצא טקסט ב-SVG'); return;
      }
      if (ext === 'dxf') {
        const lines = c.split('\n').map(l=>l.trim()), texts=[];
        for (let i=0;i<lines.length-1;i++) if (lines[i]==='TEXT'||lines[i]==='MTEXT') for (let j=i;j<Math.min(i+30,lines.length-1);j++) if (parseInt(lines[j])===1){texts.push(lines[j+1]);break;}
        texts.length ? setText(texts.join('\n')) : setErr('לא נמצא טקסט ב-DXF'); return;
      }
      setErr(`לא נתמך: .${ext}`);
    };
    reader.readAsText(file);
  };

  const dl = (content, name, type) => {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
  };

  const card={background:'#0d1525',border:'1px solid #1e2d4a',borderRadius:10,padding:'14px 16px',marginBottom:12};
  const row={display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8};
  const lbl={fontSize:13,color:'#6a8aaa'};
  const inp=(c='#00e5ff')=>({width:72,background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'5px 8px',color:c,fontSize:13,textAlign:'center',fontFamily:'inherit'});
  const tabBtn=(active)=>({flex:1,padding:'8px 4px',borderRadius:6,fontSize:12,cursor:'pointer',border:'none',background:active?'rgba(168,85,247,0.2)':'rgba(255,255,255,0.03)',color:active?'#a855f7':'#5a7a9a',fontFamily:'inherit',outline:active?'1px solid #a855f7':'1px solid transparent',transition:'all 0.15s'});

  return (
    <div dir="rtl" style={{minHeight:'100vh',background:'#0a0e1a',fontFamily:"'Segoe UI',Arial,sans-serif",fontSize:'15px',color:'#c8d8f0'}}>
      <div style={{borderBottom:'1px solid #1e2d4a',background:'linear-gradient(180deg,#0d1525,#0a0e1a)',padding:'18px 32px',display:'flex',alignItems:'center',gap:16}}>
        <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,#a855f7,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff',fontWeight:700}}>T</div>
        <div>
          <div style={{fontSize:19,fontWeight:700,color:'#e8f4ff'}}>TEXT → G-CODE</div>
          <div style={{fontSize:12,color:'#4a6a8a',marginTop:2}}>Single-Line · System Fonts · TTF/OTF</div>
        </div>
      </div>

      <div style={{padding:'20px 28px',maxWidth:1300,margin:'0 auto',display:'grid',gridTemplateColumns:'320px 1fr',gap:20,alignItems:'start'}}>
        {/* LEFT */}
        <div>
          {/* Font mode tabs */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:10}}>🔤 בחירת פונט</div>
            <div style={{display:'flex',gap:4,marginBottom:12}}>
              <button style={tabBtn(fontMode==='hershey')} onClick={()=>setFontMode('hershey')}>Single-Line</button>
              <button style={tabBtn(fontMode==='system')} onClick={()=>setFontMode('system')}>מערכת</button>
              <button style={tabBtn(fontMode==='ttf')} onClick={()=>ttfRef.current?.click()}>TTF/OTF</button>
            </div>

            {fontMode==='hershey'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {Object.entries(FONTS).map(([k,{label}])=>(
                  <button key={k} onClick={()=>setHersheyKey(k)} style={tabBtn(hersheyKey===k)}>{label}</button>
                ))}
              </div>
            )}

            {fontMode==='system'&&(
              <div>
                <select value={systemFont} onChange={e=>setSystemFont(e.target.value)}
                  style={{width:'100%',background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'7px 10px',color:'#c8d8f0',fontSize:13,fontFamily:'inherit'}}>
                  {systemFonts.length ? systemFonts.map(f=>(
                    <option key={f} value={f} style={{fontFamily:f}}>{f}</option>
                  )) : <option>טוען פונטים...</option>}
                </select>
                <div style={{fontSize:11,color:'#3a5060',marginTop:6}}>
                  נמצאו {systemFonts.length} פונטים במערכת
                </div>
              </div>
            )}

            {fontMode==='ttf'&&ttfName&&(
              <div style={{fontSize:12,color:'#a855f7',padding:'6px',background:'rgba(168,85,247,0.08)',borderRadius:6}}>
                ✓ {ttfName}
                <button onClick={()=>ttfRef.current?.click()} style={{marginRight:8,background:'none',border:'none',color:'#6a8aaa',cursor:'pointer',fontSize:11}}>החלף</button>
              </div>
            )}
            <input ref={ttfRef} type="file" accept=".ttf,.otf,.woff,.woff2" onChange={e=>{if(e.target.files[0])loadTTF(e.target.files[0])}} style={{display:'none'}}/>
          </div>

          {/* Import */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>📂 ייבוא קובץ</div>
            <button onClick={()=>importRef.current?.click()}
              style={{width:'100%',padding:'8px',borderRadius:7,fontSize:13,cursor:'pointer',background:'rgba(255,255,255,0.04)',border:'1px solid #2a3a5a',color:'#6a8aaa',fontFamily:'inherit'}}>
              📂 SVG · DXF · TXT
            </button>
            <input ref={importRef} type="file" accept=".svg,.dxf,.txt" onChange={e=>{if(e.target.files[0]){setErr('');importFile(e.target.files[0])}}} style={{display:'none'}}/>
            {err&&<div style={{marginTop:5,fontSize:11,color:'#ff8080'}}>⚠ {err}</div>}
          </div>

          {/* Text */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✏ טקסט</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} dir="auto"
              style={{width:'100%',background:'#060d1a',border:'1px solid #1e3050',borderRadius:6,padding:'8px',color:'#e8f4ff',fontSize:14,fontFamily:'inherit',resize:'vertical',boxSizing:'border-box',lineHeight:1.7}}
              placeholder="הכנס טקסט...&#10;Enter text..."/>
          </div>

          {/* Typography */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>📐 טיפוגרפיה</div>
            {[
              {l:'גודל אות (mm)',v:sizeMm,s:setSizeMm,min:1,max:200,step:0.5},
              {l:'רווח אותיות (mm)',v:spacingMm,s:setSpacingMm,min:0,max:30,step:0.5},
              {l:'גובה שורה (mm)',v:lineHMm,s:setLineHMm,min:5,max:300,step:1},
            ].map(({l,v,s,min,max,step})=>(
              <div key={l} style={row}>
                <span style={lbl}>{l}:</span>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <input type="range" min={min} max={max} step={step} value={v} onChange={e=>s(+e.target.value)} style={{width:70}}/>
                  <input type="number" min={min} max={999} step={step} value={v} onChange={e=>s(+e.target.value)} style={inp()}/>
                </div>
              </div>
            ))}
          </div>

          {/* Cut */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✂ חיתוך</div>
            <div style={row}><span style={lbl}>מהירות (mm/min):</span><input type="number" value={feedRate} min={1} onChange={e=>setFeedRate(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>ירידה (mm/min):</span><input type="number" value={plungeRate} min={1} onChange={e=>setPlungeRate(+e.target.value)} style={inp('#ff9900')}/></div>
            <div style={row}><span style={lbl}>Z בטוח (mm):</span><input type="number" value={zSafe} step={0.5} onChange={e=>setZSafe(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>עומק (mm):</span><input type="number" value={zCut} step={0.1} onChange={e=>setZCut(+e.target.value)} style={inp('#ff5050')}/></div>
            <div style={row}><span style={lbl}>X מקור:</span><input type="number" value={ox} step={1} onChange={e=>setOx(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>Y מקור:</span><input type="number" value={oy} step={1} onChange={e=>setOy(+e.target.value)} style={inp()}/></div>
          </div>

          {/* Stats */}
          <div style={{...card,background:'rgba(0,229,255,0.04)',border:'1px solid rgba(0,229,255,0.12)'}}>
            <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>קווים</div><div style={{fontSize:20,fontWeight:700,color:'#00e5ff'}}>{strokes.length}</div></div>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>אותיות</div><div style={{fontSize:20,fontWeight:700,color:'#c8d8f0'}}>{Array.from(text.replace(/\n/g,'')).length}</div></div>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>פונט</div>
                <div style={{fontSize:13,fontWeight:700,color:'#a855f7'}}>
                  {fontMode==='hershey'?FONTS[hersheyKey].label:fontMode==='system'?systemFont:ttfName.split('.')[0]||'TTF'}
                </div>
              </div>
            </div>
          </div>

          {/* Export */}
          <input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="שם קובץ"
            style={{width:'100%',background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'7px 10px',color:'#c8d8f0',fontSize:13,boxSizing:'border-box',fontFamily:'inherit',marginBottom:8}}/>
          <button onClick={()=>dl(toGcode(strokes,{feedRate,plungeRate,zSafe,zCut,ox,oy}),`${fileName}.gcode`,'text/plain')}
            disabled={!strokes.length||loading}
            style={{width:'100%',padding:'12px',borderRadius:8,fontSize:14,cursor:'pointer',background:'linear-gradient(135deg,#a855f7,#6366f1)',border:'none',color:'#fff',fontFamily:'inherit',fontWeight:600,marginBottom:8,opacity:loading?0.5:1}}>
            {loading?'⚙ מעבד...':'⬇ '+fileName+'.gcode'}
          </button>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>dl(toSVG(strokes,svgColor),`${fileName}.svg`,'image/svg+xml')}
              disabled={!strokes.length}
              style={{flex:1,padding:'9px',borderRadius:8,fontSize:13,cursor:'pointer',background:'transparent',border:'1px solid #4a3a7a',color:'#a855f7',fontFamily:'inherit'}}>
              ⬇ {fileName}.svg
            </button>
            <input type="color" value={svgColor} onChange={e=>setSvgColor(e.target.value)}
              style={{width:38,height:38,borderRadius:6,border:'1px solid #1e3050',cursor:'pointer',padding:2,background:'transparent'}}/>
          </div>
        </div>

        {/* RIGHT — preview */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'#fff',border:'1px solid #ddd',borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid #eee',fontSize:12,color:'#555',display:'flex',gap:10,alignItems:'center',background:'#f5f5f5'}}>
              <span>תצוגה מקדימה</span>
              <span style={{color:'#a855f7',fontWeight:600}}>
                {fontMode==='hershey'?FONTS[hersheyKey].label:fontMode==='system'?systemFont:ttfName||'TTF'}
              </span>
              {loading&&<span style={{color:'#ff9900'}}>⚙ מעבד...</span>}
              <span style={{color:'#bbb',marginRight:'auto',fontSize:11}}>שחור=חיתוך | אדום=אוויר</span>
            </div>
            <canvas ref={canvasRef} style={{width:'100%',height:'460px',display:'block'}}/>
          </div>
          <div style={{background:'#0d1525',border:'1px solid #1a2540',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#3a5a7a',lineHeight:1.8}}>
            <span style={{color:'#4a6a8a',fontWeight:600}}>Single-Line: </span>Sans · Italic · Bold · Gothic — עברית + לטינית
            <span style={{color:'#4a6a8a',fontWeight:600,marginRight:8}}> | </span>
            <span style={{color:'#4a6a8a',fontWeight:600}}>מערכת: </span>{systemFonts.length} פונטים זוהו
            <span style={{color:'#4a6a8a',fontWeight:600,marginRight:8}}> | </span>
            <span style={{color:'#4a6a8a',fontWeight:600}}>TTF: </span>כל פונט מהמחשב
          </div>
        </div>
      </div>
    </div>
  );
}
