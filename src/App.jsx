import { useState, useRef, useEffect } from "react";

// ============================================================
// HERSHEY FONT — Single-line strokes, coords in font units
// Each char: [advanceWidth, [[x1,y1,x2,y2], ...]]
// Font height: 21 units = cap height
// ============================================================

const H = {
  ' ':[8,[]],
  'A':[14,[[0,0,7,21],[14,0,7,21],[3,7,11,7]]],
  'B':[14,[[0,0,0,21],[0,21,9,21],[12,19,13,17],[13,17,13,14],[13,14,12,12],[12,12,9,11],[9,11,0,11],[0,11,10,11],[13,9,14,6],[14,6,14,3],[14,3,12,1],[12,1,9,0],[9,0,0,0]]],
  'C':[13,[[13,4],[11,2],[9,1],[6,1],[4,2],[2,4],[1,6],[0,9],[0,13],[1,16],[2,18],[4,20],[6,21],[9,21],[11,20],[13,18]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'D':[14,[[0,0,0,21],[0,21,7,21],[10,20],[12,18],[13,16],[14,13],[14,8],[13,5],[12,3],[10,1],[7,0],[0,0]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'E':[12,[[0,0,0,21],[0,21,11,21],[0,11,7,11],[0,0,11,0]]],
  'F':[11,[[0,0,0,21],[0,21,11,21],[0,11,7,11]]],
  'G':[14,[[13,18],[11,20],[9,21],[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[9,0],[11,1],[13,3],[13,8],[8,8]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'H':[14,[[0,0,0,21],[14,0,14,21],[0,11,14,11]]],
  'I':[4,[[0,0,4,0],[2,0,2,21],[0,21,4,21]]],
  'J':[11,[[0,2],[1,0],[3,0],[5,1],[6,3],[6,21]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'K':[13,[[0,0,0,21],[13,21,0,8],[5,13,13,0]]],
  'L':[12,[[0,21,0,0],[0,0,12,0]]],
  'M':[16,[[0,0,0,21],[0,21,8,7],[8,7,16,21],[16,21,16,0]]],
  'N':[14,[[0,0,0,21],[0,21,14,0],[14,0,14,21]]],
  'O':[14,[[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[8,0],[10,1],[12,3],[13,5],[14,8],[14,13],[13,16],[12,18],[10,20],[8,21],[6,21]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'P':[13,[[0,0,0,21],[0,21,9,21],[12,20],[13,18],[13,14],[12,12],[9,11],[0,11]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'Q':[14,[[6,21,4,20],[4,20,2,18],[2,18,1,16],[1,16,0,13],[0,13,0,8],[0,8,1,5],[1,5,2,3],[2,3,4,1],[4,1,6,0],[6,0,8,0],[8,0,10,1],[10,1,12,3],[12,3,13,5],[13,5,14,8],[14,8,14,13],[14,13,13,16],[13,16,12,18],[12,18,10,20],[10,20,8,21],[8,21,6,21],[10,6,14,0]]],
  'R':[13,[[0,0,0,21],[0,21,9,21],[12,20],[13,18],[13,14],[12,12],[9,11],[0,11],[6,11,13,0]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'S':[12,[[12,18],[10,20],[8,21],[5,21],[3,20],[1,18],[1,16],[2,14],[4,12],[9,10],[11,8],[12,6],[12,3],[10,1],[8,0],[5,0],[3,1],[1,3]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'T':[12,[[6,0,6,21],[0,21,12,21]]],
  'U':[14,[[0,21,0,5],[0,3,1,1],[1,1,3,0],[5,0,9,0],[11,1,13,3],[13,3,14,5],[14,5,14,21]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'V':[14,[[0,21,7,0],[14,21,7,0]]],
  'W':[18,[[0,21,4,0],[9,21,4,0],[9,21,14,0],[18,21,14,0]]],
  'X':[14,[[0,21,14,0],[14,21,0,0]]],
  'Y':[14,[[0,21,7,11],[7,11,7,0],[14,21,7,11]]],
  'Z':[14,[[0,21,14,21],[14,21,0,0],[0,0,14,0]]],
  'a':[12,[[9,14,9,0],[9,11,7,13],[5,14],[3,14],[1,13],[0,11],[0,9],[1,7],[3,6],[5,6],[7,7],[9,9]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'b':[12,[[0,21,0,0],[0,11,2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'c':[11,[[11,11],[9,13],[7,14],[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'd':[12,[[12,21,12,0],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'e':[11,[[0,9,11,9],[11,9,11,11],[10,13,8,14],[6,14],[4,13],[2,11],[1,9],[0,7],[0,5],[1,3],[3,2],[5,2],[7,3],[9,5]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'f':[7,[[5,21],[3,21],[2,20],[1,18],[1,0],[3,14,7,14]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'g':[12,[[12,14,12,-4],[12,-4,10,-6],[8,-7],[6,-7],[4,-6],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'h':[12,[[0,21,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'i':[4,[[1,21,1,20],[1,20,2,20],[2,20,2,21],[2,21,1,21],[1,14,1,0]]],
  'j':[5,[[2,21,2,20],[2,20,3,20],[3,20,3,21],[3,21,2,21],[3,14,3,-2],[3,-2,2,-4],[2,-4,0,-5]]],
  'k':[11,[[0,21,0,0],[0,6,9,14],[4,8,11,0]]],
  'l':[4,[[0,21,0,0]]],
  'm':[18,[[0,14,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0],[10,10,12,13],[14,14],[17,14],[19,13],[20,10],[20,0]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'n':[12,[[0,14,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'o':[12,[[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5],[12,7],[12,9],[11,11],[9,13],[7,14],[5,14]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'p':[12,[[0,14,0,-7],[0,11,2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'q':[12,[[12,14,12,-7],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'r':[7,[[0,14,0,0],[0,8,1,11],[3,13],[5,14],[7,14]]],
  's':[10,[[9,11],[7,13],[5,14],[3,14],[1,13],[0,11],[0,9],[1,8],[4,7],[6,6],[8,5],[9,3],[9,2],[8,0],[6,-1],[4,-1],[2,0],[0,2]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  't':[7,[[2,21,2,3],[2,3,3,1],[3,1,5,0],[5,0,7,0],[0,14,6,14]]],
  'u':[12,[[0,14,0,4],[0,2,1,0],[1,0,3,0],[5,0,7,1],[9,4,10,14],[10,0,10,14]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'v':[12,[[0,14,6,0],[12,14,6,0]]],
  'w':[16,[[0,14,4,0],[8,14,4,0],[8,14,12,0],[16,14,12,0]]],
  'x':[12,[[0,14,12,0],[12,14,0,0]]],
  'y':[12,[[0,14,6,0],[12,14,6,0],[6,0,5,-2],[5,-2,3,-4],[3,-4,1,-4],[1,-4,0,-3]]],
  'z':[11,[[0,14,11,14],[11,14,0,0],[0,0,11,0]]],
  '0':[12,[[5,21],[3,20],[1,18],[0,16],[0,14],[0,7],[0,5],[1,3],[3,1],[5,0],[7,0],[9,1],[11,3],[12,5],[12,7],[12,14],[12,16],[11,18],[9,20],[7,21],[5,21],[3,16,9,5]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '1':[8,[[2,17,5,21],[5,21,5,0]]],
  '2':[12,[[1,16],[2,14],[4,12],[7,10],[9,8],[10,5],[10,3],[9,1],[7,0],[5,0],[3,1],[1,3],[0,5],[0,6],[1,8],[3,10],[6,12],[9,15],[10,17],[10,19],[9,21],[7,21],[5,20],[4,19],[3,17]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '3':[12,[[1,20],[3,21],[5,21],[9,19],[10,17],[10,14],[8,11],[5,10],[8,9],[10,6],[10,3],[8,1],[6,0],[4,0],[2,1],[1,2]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '4':[12,[[8,21,8,0],[0,14,12,14],[0,14,8,21]]],
  '5':[12,[[11,20],[9,21],[4,21],[2,19],[1,17],[1,14],[2,12],[4,11],[6,11],[9,12],[11,14],[12,17],[12,19],[11,21],[9,21]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '6':[12,[[9,19],[7,21],[5,21],[3,20],[1,17],[0,13],[0,8],[1,4],[3,1],[6,0],[8,0],[11,1],[13,4],[13,6],[12,9],[10,11],[7,11],[4,10],[1,7]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '7':[12,[[0,21,12,21],[12,21,3,0]]],
  '8':[12,[[5,0],[3,1],[1,4],[1,6],[2,9],[4,11],[7,11],[10,9],[11,6],[11,4],[9,1],[7,0],[5,0]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '9':[12,[[11,14],[9,12],[7,11],[5,11],[2,12],[0,14],[0,16],[1,19],[3,21],[6,21],[9,20],[11,17],[12,13],[12,8],[11,4],[9,1],[7,0],[4,0],[2,1]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '.':[4,[[1,1],[1,0],[2,0],[2,1],[1,1]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  ',':[4,[[2,2],[2,1],[3,1],[3,2],[2,2],[1,0]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '!':[4,[[2,21,2,7],[2,2,2,1],[2,1,3,1],[3,1,3,2],[3,2,2,2]]],
  '?':[10,[[1,16],[2,14],[4,12],[7,10],[9,8],[10,5],[10,3],[9,1],[7,0],[5,0],[3,1],[2,2],[9,21],[11,19],[11,16],[9,14],[7,13]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '-':[10,[[1,10,9,10]]],
  '+':[12,[[6,21,6,0],[1,10,11,10]]],
  '=':[12,[[1,13,11,13],[1,7,11,7]]],
  '/':[10,[[0,0,10,21]]],
  '\\':[10,[[0,21,10,0]]],
  ':':[4,[[1,12],[1,11],[2,11],[2,12],[1,12],[1,2],[1,1],[2,1],[2,2],[1,2]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '"':[8,[[1,21,1,16],[6,21,6,16]]],
  "'":[4,[[1,21,1,16]]],
  '(':[6,[[4,25],[2,22],[1,18],[0,14],[0,8],[1,4],[2,0],[4,-3]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  ')':[6,[[0,25],[2,22],[3,18],[4,14],[4,8],[3,4],[2,0],[0,-3]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '@':[16,[[11,13],[10,15],[8,17],[6,18],[4,18],[2,17],[0,15],[0,9],[1,7],[3,5],[5,4],[7,4],[9,5],[11,7],[12,9],[12,13],[12,17],[11,19],[9,20],[7,20],[5,19],[3,17]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '#':[12,[[3,21,3,-7],[9,21,9,-7],[0,14,12,14],[0,3,12,3]]],
  // Hebrew
  'א':[14,[[1,0,7,14],[7,14,13,0],[7,14,7,7]]],
  'ב':[13,[[11,14,1,14],[1,14,0,12],[0,12,0,1],[0,1,11,1],[0,7,7,7]]],
  'ג':[11,[[9,14,1,14],[1,14,0,12],[0,12,0,0]]],
  'ד':[13,[[0,0,0,12],[0,12,2,14],[2,14,12,14],[12,14,12,0]]],
  'ה':[13,[[0,0,0,14],[0,14,12,14],[12,14,12,5],[6,14,6,0]]],
  'ו':[5,[[3,14,3,0]]],
  'ז':[9,[[0,14,8,14],[8,14,5,0]]],
  'ח':[13,[[0,0,0,14],[13,0,13,14],[0,14,13,14]]],
  'ט':[13,[[0,0,0,14],[0,14,13,14],[13,14,13,0],[7,14,7,5]]],
  'י':[6,[[5,14,3,12],[3,12,3,0]]],
  'כ':[12,[[11,14,1,14],[1,14,0,12],[0,12,0,1],[0,1,11,1]]],
  'ך':[12,[[11,14,1,14],[1,14,0,12],[0,12,0,-5]]],
  'ל':[11,[[9,14,1,14],[1,14,0,12],[0,12,0,6],[0,6,2,4],[2,4,9,4],[9,4,9,0]]],
  'מ':[13,[[0,0,0,14],[13,0,13,10],[13,10,6,14],[6,14,0,14],[6,14,6,0]]],
  'ם':[13,[[0,0,0,14],[13,0,13,14],[0,14,13,14],[0,0,5,0]]],
  'נ':[11,[[9,14,1,14],[1,14,0,12],[0,12,0,0],[0,14,9,0]]],
  'ן':[5,[[3,14,3,-4]]],
  'ס':[13,[[6,14],[4,14],[2,13],[0,11],[0,5],[2,3],[4,2],[6,2],[8,2],[10,3],[12,5],[12,9],[10,11],[8,13],[6,14],[6,7,0,7]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  'ע':[13,[[0,14,4,7],[4,7,6,0],[6,0,9,7],[9,7,13,14],[4,7,9,7]]],
  'פ':[12,[[11,14,2,14],[2,14,0,12],[0,12,0,8],[0,8,2,6],[2,6,7,6],[7,6,7,0],[0,0,7,0]]],
  'ף':[12,[[11,14,2,14],[2,14,0,12],[0,12,0,8],[0,8,2,6],[2,6,7,6],[7,6,7,-5]]],
  'צ':[13,[[0,0,4,14],[4,14,8,0],[8,0,12,14],[4,14,12,14]]],
  'ץ':[13,[[0,0,4,14],[4,14,8,0],[8,0,12,14],[4,14,12,14],[8,0,8,-5]]],
  'ק':[12,[[0,0,0,14],[0,14,11,14],[11,14,11,5]]],
  'ר':[11,[[0,0,0,12],[0,12,2,14],[2,14,10,14]]],
  'ש':[14,[[0,0,0,14],[0,14,7,14],[7,14,7,0],[7,14,14,0]]],
  'ת':[14,[[0,0,0,14],[0,14,14,14],[14,14,14,5],[7,14,7,0]]],
};

// ============================================================
// TEXT → STROKES
// ============================================================

function textToStrokes(text, fontSizeMm, letterSpacingMm, lineHeightMm) {
  const FONT_HEIGHT = 21; // Hershey cap height in units
  const scale = fontSizeMm / FONT_HEIGHT;
  const lines = text.split('\n');
  const allStrokes = [];

  lines.forEach((line, lineIdx) => {
    let xOff = 0;
    const yOff = lineIdx * lineHeightMm;
    Array.from(line).forEach(ch => {
      const def = H[ch] || H[' '];
      const [w, segs] = def;
      segs.forEach(([x1,y1,x2,y2]) => {
        allStrokes.push({
          x1: xOff + x1*scale,
          y1: yOff + y1*scale,
          x2: xOff + x2*scale,
          y2: yOff + y2*scale,
        });
      });
      xOff += (w + letterSpacingMm/scale) * scale;
    });
  });
  return allStrokes;
}

// ============================================================
// EXPORT
// ============================================================

function toGcode(strokes, { feedRate, plungeRate, zSafe, zCut, ox, oy }) {
  let g = `; Single-Line Text\nG21\nG90\nG0 Z${zSafe}\n`;
  let px = null, py = null;
  for (const s of strokes) {
    const x1=+(s.x1+ox).toFixed(3), y1=+(s.y1+oy).toFixed(3);
    const x2=+(s.x2+ox).toFixed(3), y2=+(s.y2+oy).toFixed(3);
    const lift = px===null || Math.hypot(px-x1,py-y1) > 0.05;
    if (lift) {
      g += `G0 Z${zSafe}\nG0 X${x1} Y${y1}\nG1 Z${zCut} F${plungeRate}\n`;
    }
    g += `G1 X${x2} Y${y2} F${feedRate}\n`;
    px=x2; py=y2;
  }
  return g + `G0 Z${zSafe}\nM2\n`;
}

function toSVG(strokes, color) {
  if (!strokes.length) return '';
  let x1=Infinity,y1=Infinity,x2=-Infinity,y2=-Infinity;
  strokes.forEach(s=>{x1=Math.min(x1,s.x1,s.x2);y1=Math.min(y1,s.y1,s.y2);x2=Math.max(x2,s.x1,s.x2);y2=Math.max(y2,s.y1,s.y2);});
  const p=5, W=x2-x1+p*2, H=y2-y1+p*2;
  const lines = strokes.map(s=>`<line x1="${(s.x1-x1+p).toFixed(2)}" y1="${(H-(s.y1-y1+p)).toFixed(2)}" x2="${(s.x2-x1+p).toFixed(2)}" y2="${(H-(s.y2-y1+p)).toFixed(2)}" stroke="${color}" stroke-width="0.5" stroke-linecap="round"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}mm" height="${H.toFixed(1)}mm" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">\n${lines}\n</svg>`;
}

// ============================================================
// CANVAS PREVIEW
// ============================================================

function drawCanvas(canvas, strokes) {
  if (!canvas) return;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,W,H);
  if (!strokes.length) {
    ctx.fillStyle = '#aaa'; ctx.font='14px Segoe UI'; ctx.textAlign='center';
    ctx.fillText('הכנס טקסט לתצוגה', W/2, H/2); return;
  }
  let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
  strokes.forEach(s=>{mnX=Math.min(mnX,s.x1,s.x2);mnY=Math.min(mnY,s.y1,s.y2);mxX=Math.max(mxX,s.x1,s.x2);mxY=Math.max(mxY,s.y1,s.y2);});
  const pad=30, bw=mxX-mnX||1, bh=mxY-mnY||1;
  const sc = Math.min((W-pad*2)/bw, (H-pad*2)/bh);
  const ox = pad+(W-pad*2-bw*sc)/2, oy = pad+(H-pad*2-bh*sc)/2;
  const tx=x=>ox+(x-mnX)*sc, ty=y=>H-oy-(y-mnY)*sc;
  let prev=null;
  for (const s of strokes) {
    if (prev && Math.hypot(prev.x2-s.x1,prev.y2-s.y1)>0.05) {
      ctx.strokeStyle='rgba(255,100,100,0.4)'; ctx.lineWidth=0.8; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(tx(prev.x2),ty(prev.y2)); ctx.lineTo(tx(s.x1),ty(s.y1)); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=1.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(tx(s.x1),ty(s.y1)); ctx.lineTo(tx(s.x2),ty(s.y2)); ctx.stroke();
    prev=s;
  }
}

// ============================================================
// IMPORT SVG/DXF TEXT (extract text content)
// ============================================================

function extractTextFromSVG(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');
  const texts = [];
  doc.querySelectorAll('text,tspan').forEach(el => {
    const t = el.textContent.trim();
    if (t) texts.push(t);
  });
  return texts.join('\n');
}

function extractTextFromDXF(content) {
  const lines = content.split('\n').map(l=>l.trim());
  const texts = [];
  for (let i=0;i<lines.length-1;i++) {
    if ((lines[i]==='TEXT'||lines[i]==='MTEXT') && lines[i+1]) {
      for (let j=i;j<Math.min(i+30,lines.length-1);j++) {
        if (parseInt(lines[j])===1) { texts.push(lines[j+1]); break; }
      }
    }
  }
  return texts.join('\n');
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TextToGcode() {
  const [text, setText] = useState('Hello CNC\nשלום עולם');
  const [fontSizeMm, setFontSizeMm] = useState(10);
  const [letterSpacingMm, setLetterSpacingMm] = useState(1);
  const [lineHeightMm, setLineHeightMm] = useState(20);
  const [feedRate, setFeedRate] = useState(800);
  const [plungeRate, setPlungeRate] = useState(200);
  const [zSafe, setZSafe] = useState(5);
  const [zCut, setZCut] = useState(-0.3);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [svgColor, setSvgColor] = useState('#000000');
  const [fileName, setFileName] = useState('text');
  const [importErr, setImportErr] = useState('');

  const canvasRef = useRef(null);
  const fileInput = useRef(null);
  const resizeObs = useRef(null);

  const strokes = textToStrokes(text, fontSizeMm, letterSpacingMm, lineHeightMm);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, strokes);
    if (resizeObs.current) resizeObs.current.disconnect();
    resizeObs.current = new ResizeObserver(() => drawCanvas(canvas, strokes));
    resizeObs.current.observe(canvas);
    return () => resizeObs.current?.disconnect();
  }, [strokes]);

  const importFile = (file) => {
    setImportErr('');
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      let extracted = '';
      if (ext === 'svg') extracted = extractTextFromSVG(content);
      else if (ext === 'dxf') extracted = extractTextFromDXF(content);
      else if (ext === 'txt') extracted = content;
      else { setImportErr(`לא נתמך: .${ext} — נתמכים: SVG, DXF, TXT`); return; }
      if (!extracted.trim()) { setImportErr('לא נמצא טקסט בקובץ'); return; }
      setText(extracted.trim());
    };
    reader.readAsText(file);
  };

  const exportGcode = () => {
    const content = toGcode(strokes, {feedRate,plungeRate,zSafe,zCut,ox,oy});
    const url = URL.createObjectURL(new Blob([content],{type:'text/plain'}));
    const a=document.createElement('a'); a.href=url; a.download=`${fileName}.gcode`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportSVG = () => {
    const content = toSVG(strokes, svgColor);
    const url = URL.createObjectURL(new Blob([content],{type:'image/svg+xml'}));
    const a=document.createElement('a'); a.href=url; a.download=`${fileName}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const unknownChars = [...new Set(Array.from(text).filter(c=>c!=='\n'&&c!==' '&&!H[c]))];

  const card  = {background:'#0d1525',border:'1px solid #1e2d4a',borderRadius:10,padding:'14px 16px',marginBottom:12};
  const row   = {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8};
  const lbl   = {fontSize:13,color:'#6a8aaa'};
  const inp   = (c='#00e5ff') => ({width:75,background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'5px 8px',color:c,fontSize:13,textAlign:'center',fontFamily:'inherit'});

  return (
    <div dir="rtl" style={{minHeight:'100vh',background:'#0a0e1a',fontFamily:"'Segoe UI',Arial,sans-serif",fontSize:'15px',color:'#c8d8f0'}}>

      {/* Header */}
      <div style={{borderBottom:'1px solid #1e2d4a',background:'linear-gradient(180deg,#0d1525,#0a0e1a)',padding:'18px 32px',display:'flex',alignItems:'center',gap:16}}>
        <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,#a855f7,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff',fontWeight:700}}>T</div>
        <div>
          <div style={{fontSize:19,fontWeight:700,color:'#e8f4ff'}}>TEXT → G-CODE</div>
          <div style={{fontSize:12,color:'#4a6a8a',marginTop:2}}>Hershey Single-Line Font — קו אחד לכל אות</div>
        </div>
      </div>

      <div style={{padding:'20px 28px',maxWidth:1300,margin:'0 auto',display:'grid',gridTemplateColumns:'300px 1fr',gap:20,alignItems:'start'}}>

        {/* ── LEFT PANEL ── */}
        <div>

          {/* Import */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>📂 ייבוא קובץ (SVG / DXF / TXT)</div>
            <button onClick={()=>fileInput.current?.click()}
              style={{width:'100%',padding:'9px',borderRadius:7,fontSize:13,cursor:'pointer',background:'rgba(168,85,247,0.1)',border:'1px solid #4a3a7a',color:'#a855f7',fontFamily:'inherit'}}>
              📂 בחר קובץ לייבוא
            </button>
            <input ref={fileInput} type="file" accept=".svg,.dxf,.txt"
              onChange={e=>{if(e.target.files[0])importFile(e.target.files[0])}} style={{display:'none'}}/>
            {importErr && <div style={{marginTop:6,fontSize:11,color:'#ff8080'}}>⚠ {importErr}</div>}
          </div>

          {/* Text */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✏ טקסט</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} dir="auto"
              style={{width:'100%',background:'#060d1a',border:'1px solid #1e3050',borderRadius:6,padding:'8px',color:'#e8f4ff',fontSize:14,fontFamily:'inherit',resize:'vertical',boxSizing:'border-box',lineHeight:1.7}}
              placeholder="הכנס טקסט...&#10;Enter text..."/>
            {unknownChars.length>0&&(
              <div style={{marginTop:6,fontSize:11,color:'#ff9900',background:'rgba(255,153,0,0.08)',borderRadius:5,padding:'5px 8px'}}>
                ⚠ תווים לא נתמכים: {unknownChars.map(c=>`"${c}"`).join(' ')}
              </div>
            )}
          </div>

          {/* Typography */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>🔤 טיפוגרפיה</div>
            <div style={row}>
              <span style={lbl}>גודל אות (mm):</span>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <input type="range" min={1} max={100} step={0.5} value={fontSizeMm}
                  onChange={e=>setFontSizeMm(+e.target.value)} style={{width:80}}/>
                <input type="number" min={1} max={500} step={0.5} value={fontSizeMm}
                  onChange={e=>setFontSizeMm(+e.target.value)} style={inp()}/>
              </div>
            </div>
            <div style={row}>
              <span style={lbl}>רווח אותיות (mm):</span>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <input type="range" min={0} max={20} step={0.5} value={letterSpacingMm}
                  onChange={e=>setLetterSpacingMm(+e.target.value)} style={{width:80}}/>
                <input type="number" min={0} max={100} step={0.5} value={letterSpacingMm}
                  onChange={e=>setLetterSpacingMm(+e.target.value)} style={inp()}/>
              </div>
            </div>
            <div style={row}>
              <span style={lbl}>גובה שורה (mm):</span>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <input type="range" min={5} max={200} step={1} value={lineHeightMm}
                  onChange={e=>setLineHeightMm(+e.target.value)} style={{width:80}}/>
                <input type="number" min={1} max={500} step={1} value={lineHeightMm}
                  onChange={e=>setLineHeightMm(+e.target.value)} style={inp()}/>
              </div>
            </div>
          </div>

          {/* Cut */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✂ פרמטרי חיתוך</div>
            <div style={row}><span style={lbl}>מהירות (mm/min):</span><input type="number" value={feedRate} min={1} onChange={e=>setFeedRate(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>ירידה (mm/min):</span><input type="number" value={plungeRate} min={1} onChange={e=>setPlungeRate(+e.target.value)} style={inp('#ff9900')}/></div>
            <div style={row}><span style={lbl}>Z בטוח (mm):</span><input type="number" value={zSafe} step={0.5} onChange={e=>setZSafe(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>עומק חריטה (mm):</span><input type="number" value={zCut} step={0.1} onChange={e=>setZCut(+e.target.value)} style={inp('#ff5050')}/></div>
            <div style={row}><span style={lbl}>X מקור (mm):</span><input type="number" value={ox} step={1} onChange={e=>setOx(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>Y מקור (mm):</span><input type="number" value={oy} step={1} onChange={e=>setOy(+e.target.value)} style={inp()}/></div>
          </div>

          {/* Stats */}
          <div style={{...card,background:'rgba(0,229,255,0.04)',border:'1px solid rgba(0,229,255,0.12)'}}>
            <div style={{display:'flex',gap:20}}>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>קווים</div><div style={{fontSize:20,fontWeight:700,color:'#00e5ff'}}>{strokes.length}</div></div>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>אותיות</div><div style={{fontSize:20,fontWeight:700,color:'#c8d8f0'}}>{Array.from(text.replace(/\n/g,'')).length}</div></div>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>שורות</div><div style={{fontSize:20,fontWeight:700,color:'#c8d8f0'}}>{text.split('\n').length}</div></div>
            </div>
          </div>

          {/* Export */}
          <div style={{marginBottom:8}}>
            <input value={fileName} onChange={e=>setFileName(e.target.value)}
              placeholder="שם קובץ"
              style={{width:'100%',background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'7px 10px',color:'#c8d8f0',fontSize:13,boxSizing:'border-box',fontFamily:'inherit',marginBottom:8}}/>
          </div>
          <button onClick={exportGcode} disabled={!strokes.length}
            style={{width:'100%',padding:'12px',borderRadius:8,fontSize:14,cursor:'pointer',background:'linear-gradient(135deg,#a855f7,#6366f1)',border:'none',color:'#fff',fontFamily:'inherit',fontWeight:600,marginBottom:8}}>
            ⬇ {fileName}.gcode
          </button>
          <div style={{display:'flex',gap:8}}>
            <button onClick={exportSVG} disabled={!strokes.length}
              style={{flex:1,padding:'9px',borderRadius:8,fontSize:13,cursor:'pointer',background:'transparent',border:'1px solid #4a3a7a',color:'#a855f7',fontFamily:'inherit'}}>
              ⬇ {fileName}.svg
            </button>
            <input type="color" value={svgColor} onChange={e=>setSvgColor(e.target.value)}
              title="צבע SVG"
              style={{width:38,height:38,borderRadius:6,border:'1px solid #1e3050',cursor:'pointer',padding:2,background:'transparent'}}/>
          </div>
        </div>

        {/* ── RIGHT PANEL — Preview ── */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'#ffffff',border:'1px solid #ddd',borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid #eee',fontSize:12,color:'#666',display:'flex',gap:12,background:'#f8f8f8'}}>
              <span>תצוגה מקדימה</span>
              <span style={{color:'#999'}}>שחור = חיתוך | אדום = תנועת אוויר</span>
            </div>
            <canvas ref={canvasRef} style={{width:'100%',height:'500px',display:'block'}}/>
          </div>
          <div style={{background:'#0d1525',border:'1px solid #1a2540',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#3a5a7a'}}>
            <span style={{color:'#4a6a8a',fontWeight:600}}>תווים נתמכים: </span>
            A-Z · a-z · 0-9 · א-ת · . , ! ? - + = / : " ' ( ) @ # % * &lt; &gt;
          </div>
        </div>
      </div>
    </div>
  );
}
